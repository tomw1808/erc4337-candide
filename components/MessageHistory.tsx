"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Log } from "viem";
import { useContractEvent, usePublicClient } from "wagmi";
import ChatMessage from "./ChatMessage";
import ScrollableBox from "./ScrollableBox";
import { Message } from "@/lib/types/Message";

// const chatterjson = require("../../chatter-contracts/out/Chatter.sol/Chatter.json");
import chatterabi from "@/lib/chatter";
const chatterAddress = process.env.NEXT_PUBLIC_CHATTER_ADDRESS as `0x${string}`;

export default function MessageHistory({ address, pendingMessage, pendingIcon, SetPendingMessage }: { address: `0x${string}` | undefined, pendingMessage?: Message, pendingIcon?: string, SetPendingMessage?: Dispatch<SetStateAction<Message | undefined>> }) {

    const [messages, setMessages] = useState<Message[]>();
    const publicClient = usePublicClient();

    useEffect(() => {
        setMessages([]);
        publicClient.getBlockNumber().then(blocknumber => {
            publicClient.getContractEvents({
                address: chatterAddress,
                abi: chatterabi,
                eventName: "Message",
                fromBlock: blocknumber - BigInt(256),
                toBlock: 'latest'
            }).then((logs) => {setMessages(logs as Message[])});
        });


    }, []);

    useContractEvent({
        address: chatterAddress,
        abi: chatterabi,
        eventName: "Message",
        listener(logs) {
            console.log({logs, pendingMessage, SetPendingMessage})
            if (pendingMessage !== undefined && SetPendingMessage !== undefined) {
                for (let i = 0; i < logs.length; i++) {
                    if (
                        logs[i].args.message == pendingMessage.args.message &&
                        logs[i].args.sender == pendingMessage.args.sender) {
                        SetPendingMessage(undefined);
                    } else {
                        console.log({logs, pendingMessage})
                    }
                }
            } else {
                console.log({logs, pendingMessage})
            }
            setMessages(oldMessages => { return oldMessages ? [...oldMessages, ...logs as Message[]] : logs as Message[] });

            
        }
    })

    return <ScrollableBox className='flex flex-col py-5 px-2 w-full h-full overflow-y-auto scrollbar-thumb-blue scrollbar-track-blue scrollbar-w-2 scrollbar-track-blue-lighter scrolling-touch'>
        {messages?.map((logmsg, i) => <ChatMessage address={logmsg.args.sender} message={logmsg.args.message} key={i} connectedAddress={address} />)}
        {pendingMessage && <div className="flex flex-row items-center w-full justify-end"><span className="p-3">{pendingIcon}</span> <ChatMessage address={pendingMessage.args.sender} message={pendingMessage.args.message} connectedAddress={address} /></div>}
    </ScrollableBox>

}