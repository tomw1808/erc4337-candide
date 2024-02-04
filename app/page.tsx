"use client";
import MessageHistory from '@/components/MessageHistory';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { encodeFunctionData, getAddress } from 'viem';
import {
  SafeAccountV0_2_0 as SafeAccount,
  UserOperation, MetaTransaction
} from "abstractionkit";

const ZeroAddress = "0x0000000000000000000000000000000000000000";
const UserOperationDummyValues: UserOperation = {
	//dummy values for somewhat accurate gas estimation
	sender: ZeroAddress,
	nonce: BigInt(0),
	initCode: "0x",
	callData: "0x",
	callGasLimit: BigInt(0xffffff),
	verificationGasLimit: BigInt(0xffffff),
	preVerificationGas: BigInt(0xffffff),
	maxFeePerGas: BigInt(0xffffff),
	maxPriorityFeePerGas: BigInt(0xffffff),
	paymasterAndData: "0x",
	signature: "0x",
};

import entrypointabi from "../lib/entrypoint";

import { useAccount, useChainId, useContractWrite, usePrepareContractWrite, usePublicClient, useWalletClient } from 'wagmi';
import JazziconImage from '@/components/JazziconImage';
import { Message } from '@/lib/types/Message';
const rpcUrl = "https://sepolia.test.voltaire.candidewallet.com/rpc";
// const rpcUrl = `https://api.stackup.sh/v1/node/${process.env.NEXT_PUBLIC_STACKUP_API}`;

// const paymasterApiKey = "b176764585ecc51edc387ef3ac8c6a36";;
// const paymasterRpc = `https://api.candide.dev/paymaster/v1/goerli/${paymasterApiKey}`;


// const chatterjson = require("../../../chatter-contracts/out/Chatter.sol/Chatter.json");
import chatterabi from "@/lib/chatter";
const chatterAddress = process.env.NEXT_PUBLIC_CHATTER_ADDRESS as `0x${string}`;

const entrypointAddress = process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS as `0x${string}`;
;

const naivePaymasterThatPaysEverything = process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS as `0x${string}`;

export default function CandideSafeWallet() {

  const [connectedAddress, setConnectedAddress] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const { address, isConnected } = useAccount();
  const [safeAccount, setSafeAccount] = useState<SafeAccount>();

  const [pendingMessage, SetPendingMessage] = useState<Message | undefined>();
  const [pendingIcon, SetPendingIcon] = useState<string>("");

  const [useSmartWallet, SetUseSmartWallet] = useState<boolean>(true);
  const [initCode, SetInitCode] = useState<`0x${string}`>();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [errorMessage, SetErrorMessage] = useState<string | undefined>();


  const chainId = useChainId();


  useEffect(() => {
    if (address) {
      setConnectedAddress(address);
    } else {
      setConnectedAddress("0x0000000000000000000000000000000000000000");
    }
    if (useSmartWallet && address) {
      const newSafeAccount = SafeAccount.initializeNewAccount([address]);
      setSafeAccount(newSafeAccount);

      // const [newAccountAddress, walletInitCode] = SafeAccount.createAccountAddressAndInitCode([
      //   address,
      // ]);
      // console.log({ newAccountAddress, walletInitCode });
      // SetInitCode(walletInitCode as `0x${string}`);
      setConnectedAddress(getAddress(newSafeAccount.accountAddress));
    }
  }, [useSmartWallet, chainId, address])

  const [message, setMessage] = useState<string>("");


  const { config, error } = usePrepareContractWrite({
    address: chatterAddress,
    abi: chatterabi,
    functionName: 'sendMessage',
    args: [message]
  })
  const { write, data } = useContractWrite(config);

  async function sendMessage() {
    if (message && message.length > 0 && connectedAddress && safeAccount && address) {
      try {
        //lock input field
        //set pending message
        SetErrorMessage(undefined);

        SetPendingIcon("🧐")
        const pendingLog: Message = {
          args: {
            sender: getAddress(connectedAddress),
            message
          }
        }
        SetPendingMessage(pendingLog);

        const data = encodeFunctionData({
          abi: chatterabi,
          functionName: 'sendMessage',
          args: [message]
        });

        console.log({ chatterAddress, message, data })

        const transaction: MetaTransaction = {
          to: chatterAddress,
          data,
          value: BigInt(0)
        }

        const callData = SafeAccount.createAccountCallDataSingleTransaction(transaction);

        const nonce = await publicClient.readContract({
          address: entrypointAddress,
          abi: entrypointabi,
          functionName: 'getNonce',
          args: [connectedAddress, BigInt(0)]
        });
        console.log(nonce);

        const initCode = SafeAccount.createInitCode([address]);

        let user_operation: UserOperation = {
          ...UserOperationDummyValues,
          sender: connectedAddress as string,
          nonce: nonce > 0 ? BigInt(nonce) : BigInt(0),
          initCode: nonce > 0 ? '0x' : initCode as string,
          callData
        };

        console.log({ user_operation });


        SetPendingIcon("🧮")

       const {
          maxFeePerGas,
          maxPriorityFeePerGas
        } = await publicClient.estimateFeesPerGas();

        console.log(maxFeePerGas, maxPriorityFeePerGas)
        if (maxFeePerGas && maxPriorityFeePerGas) {
          user_operation.maxFeePerGas = BigInt(
            Math.round(Number(maxFeePerGas) * 1.5)
          );

          user_operation.maxPriorityFeePerGas = BigInt(
            Math.round(Number(maxPriorityFeePerGas) * 1.5)
          );
        }


        user_operation.paymasterAndData = naivePaymasterThatPaysEverything; //attach the paymaster contract


        const [preVerificationGas, verificationGasLimit, callGasLimit] = await safeAccount.estimateUserOperationGas(user_operation, rpcUrl);
        user_operation.preVerificationGas = BigInt(Math.round(Number(preVerificationGas) * 1.2));
        user_operation.verificationGasLimit = verificationGasLimit;
        user_operation.callGasLimit = callGasLimit;


        console.log(user_operation)

        SetPendingIcon("✍🏻")

        const validAfter = BigInt(0);
        const validUntil = BigInt(0);

        const SafeUserOperation = {
          safe: user_operation.sender,
          nonce: user_operation.nonce,
          initCode: user_operation.initCode,
          callData: user_operation.callData,
          callGasLimit: user_operation.callGasLimit,
          verificationGasLimit: user_operation.verificationGasLimit,
          preVerificationGas: user_operation.preVerificationGas,
          maxFeePerGas: user_operation.maxFeePerGas,
          maxPriorityFeePerGas: user_operation.maxPriorityFeePerGas,
          paymasterAndData: user_operation.paymasterAndData,
          validAfter,
          validUntil,
          entryPoint: safeAccount.entrypointAddress,
        };

        const signersAddresses = [];
        const signatures = [];

        // All properties on a domain are optional
        const domain = {

          chainId,
          verifyingContract: safeAccount.safe4337ModuleAddress as `0x${string}`,
        } as const

        const types = SafeAccount.EIP712_SAFE_OPERATION_TYPE;

        const signature = await walletClient?.signTypedData({
          domain,
          types,
          primaryType: 'SafeOp',
          message: SafeUserOperation,
        })


        signersAddresses.push(address);
        signatures.push(signature || "0x0");

        console.log({signersAddresses, signatures})


        user_operation.signature = SafeAccount.formatEip712SignaturesToUseroperationSignature(
          signersAddresses,
          signatures,
          validAfter,
          validUntil,
        );

        console.log(user_operation);
        //want to test it manually? use this:
        // await walletClient?.writeContract({
        //       address: entrypointAddress,
        //       abi: entrypointabi,
        //       functionName: 'handleOps',
        //       args: [[user_operation], address],
        //       account: address,
        //   })
        const sendUserOperationResponse = await safeAccount.sendUserOperation(user_operation, rpcUrl)

        console.log("sendUserOperationResponse: " + sendUserOperationResponse);
        console.log("Useroperation sent. Waiting to be included...");
        SetPendingIcon("⏳")
        const receipt = await sendUserOperationResponse.included()

        console.log("receipt: ", receipt);
        SetPendingMessage(undefined);


      } catch (e: any) {
        //remove pendingMessage
        SetPendingMessage(undefined);
        SetErrorMessage(e.message ?? e.toString())
        console.error(e);
      }
    }


  }

  return (
    <main className="container max-w-xl mx-auto">
      <div className='flex flex-col h-screen justify-between gap-5 '>
        <div className='flex flex-col gap-5 py-5'>
          <div className='flex justify-between items-center'>
            <ConnectButton />
            {isConnected && <div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useSmartWallet} className="sr-only peer" onChange={() => { SetUseSmartWallet(!useSmartWallet) }} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Smart Wallet</span>
              </label>


            </div>}
          </div>
          {isConnected && <div className='flex justify-between items-center'>
            Account: {connectedAddress && <JazziconImage address={connectedAddress} className='h-6 w-6 rounded-full' />} {connectedAddress}
          </div>
          }
        </div>
        <MessageHistory address={getAddress(connectedAddress)} pendingMessage={pendingMessage} pendingIcon={pendingIcon} SetPendingMessage={SetPendingMessage} />
        <div className="flex flex-col w-full p-5 border-t-2">
          <div className='text-red-500'>{errorMessage}</div>
          <div className='flex w-full'>
            <input
              type='text'
              value={message}
              disabled={pendingMessage !== undefined || !isConnected}
              onChange={(e) => { setMessage(e.target.value) }}
              onKeyDown={event => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  sendMessage();
                }
              }}
              placeholder='Hi there...'
              className="w-full text-gray-600 disabled:placeholder-gray-300 disabled:bg-gray-100 p-3 bg-gray-200 rounded-l-md focus:outline-none focus:placeholder-gray-300"
            />
            <button
              onClick={(e) => { e.preventDefault(), sendMessage() }}
              disabled={pendingMessage !== undefined || !isConnected}
              type='button'
              className="px-4 py-3 bg-blue-500 rounded-r-lg hover:bg-blue-400 ease-in-out duration-500 disabled:bg-gray-300"
            >📩</button>
          </div>
        </div>
      </div>
    </main >
  )
}
