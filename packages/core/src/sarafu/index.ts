import { SARAFU_POOL_ABI, SARAFU_TOKEN_REGISTRY_ABI } from "@/abi/sarafu";
import { evmClient } from "@/blockchain-client";
import { createTransaction, getRPC, TransactionData } from "@/wallet";
import { ChainId } from "@/wallet/types";
import { binary } from "drizzle-orm/mysql-core";
import { encodeFunctionData, erc20Abi, parseAbi, parseSignature } from "viem";
export const SARAFU_CUSD_TOKEN = "0x765de816845861e75a25fca122bb6898b8b1282a";
export class SarafuWrapper {
  chainId: ChainId;
  rpcUrl: string;

  constructor(chainId: ChainId) {
    if (chainId !== 42220) {
      throw new Error("Invalid chainId");
    }
    this.chainId = chainId;
    this.rpcUrl = getRPC(chainId);
  }
  async deposit(poolAddress: string, amountInCUSD: bigint) {
    const client = evmClient(this.chainId)
    const isRegistered = await client.readContract({
      abi:SARAFU_TOKEN_REGISTRY_ABI,
      functionName:"deactivate",
      address: "0x01eD8Fe01a2Ca44Cb26D00b1309d7D777471D00C",
      args:[poolAddress]
    })
    if(!isRegistered){
      throw new Error("Pool not registered")
    }

    const txData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [poolAddress, amountInCUSD],
    });
    const tx: TransactionData[] = [];
    tx.push(
      {
        data: txData,
        to: SARAFU_CUSD_TOKEN,
        value: "0",
      }
    );
    const hash = await createTransaction(tx, "reserve", this.chainId,"celo");
    return hash;
  }
}
