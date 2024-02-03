import { useState } from "react";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

// const chatterjson = require("../../chatter-contracts/out/Chatter.sol/Chatter.json");
import chatterabi from "@/lib/chatter";
const chatterAddress = process.env.NEXT_PUBLIC_CHATTER_ADDRESS as `0x${string}`;

export default function SendMessage() {
    const [message, setMessage] = useState<string>("");


    const { config, error } = usePrepareContractWrite({
        address: chatterAddress,
        abi: chatterabi,
        functionName: 'sendMessage',
        args: [message]
    })
    const { write, data } = useContractWrite(config);

    function sendMessage() {
        if (message && message.length > 0) {
            write?.();
        }
    }

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
        onSettled() {
            setMessage("");
        }
    })

    return <div className="flex w-full p-5 border-t-2">
        <input
            type='text'
            value={message}
            onChange={(e) => { setMessage(e.target.value) }}
            onKeyDown={event => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    sendMessage();
                }
            }}
            placeholder='Hi there...'
            className="w-full text-gray-600 p-3 bg-gray-200 rounded-l-md focus:outline-none focus:placeholder-gray-300"
        />
        <button
            onClick={(e) => { e.preventDefault(), sendMessage() }}
            type='button'
            className="px-4 py-3 bg-blue-500 rounded-r-lg hover:bg-blue-400 ease-in-out duration-500"
        >📩</button>
    </div>
}