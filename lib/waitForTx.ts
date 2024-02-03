import { Bundler, UserOperationReceiptResult } from "abstractionkit";
import { Hash } from "viem";

export default async function waitForUserOperationTransaction (hash: Hash, bunder: Bundler): Promise<Hash> {
    for (let i = 0; i < 20; i++) {
      const txRetryIntervalWithJitterMs =
        1000 * Math.pow(1.5, i) +
        Math.random() * 100;

      await new Promise((resolve) =>
        setTimeout(resolve, txRetryIntervalWithJitterMs)
      );
      const receipt = await bunder.getUserOperationReceipt(
        hash as `0x${string}`
      ).catch((e) => {
        //do nothing here, just wait
      }) as UserOperationReceiptResult;
      console.log("retrying to get the receipt")
      if (receipt.receipt && receipt.receipt.transactionHash) {
        return receipt.receipt.transactionHash as `0x${string}`;
      }
    }

    throw new Error("Failed to find transaction for User Operation");
  };