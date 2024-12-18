import { SARAFU_POOL_ABI } from "@/abi";
import { createTransaction, getRPC, TransactionData, usdcAddress } from "@/wallet";
import { ChainId } from "@/wallet/types";
import { binary } from "drizzle-orm/mysql-core";
import { encodeFunctionData, erc20Abi, parseAbi, parseSignature } from "viem";
export const SARAFU_CUSD_TOKEN = "0x765de816845861e75a25fca122bb6898b8b1282a" 
export class SarafuWrapper {
    chainId:ChainId;
    rpcUrl:string;
 
    constructor(chainId:ChainId){
        if(chainId !== 42220){
            throw new Error("Invalid chainId")
        }
        this.chainId = chainId;
        this.rpcUrl = getRPC(chainId);
    }
    async deposit(poolAddress:string,amountInCUSD:bigint){
       const approveTxData = encodeFunctionData({
        abi:erc20Abi,
        functionName:"approve",
        args:[poolAddress,amountInCUSD]
       })
       
       const txData = encodeFunctionData({
        abi:SARAFU_POOL_ABI,
        functionName:"deposit",
        args:[SARAFU_CUSD_TOKEN,amountInCUSD]
       })
       const tx : TransactionData []= []
       tx.push({
        data:approveTxData,
        to:SARAFU_CUSD_TOKEN,
        value:"0"
       },{
            data:txData,
            to:poolAddress,
            value:"0"
       })
       const hash =await createTransaction(tx,"reserve",this.chainId)
       return hash
    }
}