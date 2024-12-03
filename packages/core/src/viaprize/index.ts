import { createTransaction, createTronTransaction, getRPC, usdcAddress } from "@/wallet";
import { ChainId } from "@/wallet/types";
import { binary } from "drizzle-orm/mysql-core";
import { encodeFunctionData, erc20Abi, parseAbi, parseSignature } from "viem";

export class ViaprizeWrapper {
    chainId:ChainId;
    rpcUrl:string;
    constructor(chainId:ChainId){
        this.chainId = chainId;
        this.rpcUrl = getRPC(chainId);
    }
    async fundPrize(userAddress:`0x${string}`,contractAddress:`0x${string}`,amount:bigint,deadline : number,signature:`0x${string}`, ethSignedMessage: `0x${string}`){
       const {r,s,v} = parseSignature(signature)
       console.log({r,s,v})
       console.log({userAddress,contractAddress,amount,deadline,signature,ethSignedMessage})
       const txDataReserveToUser = encodeFunctionData({
        abi:erc20Abi,
        functionName:"transfer",
        args:[userAddress,amount]
       })
       const fundUsdcAbi = parseAbi(['function addUsdcFunds(uint256 _amountUsdc, uint256 _deadline, uint8 v, bytes32 s, bytes32 r, bytes32 _ethSignedMessageHash, bool _fiatPayment)'])

       const txDataFundUsdc = encodeFunctionData({
        abi:fundUsdcAbi,
        functionName:"addUsdcFunds",
        args:[amount,BigInt(deadline),Number.parseInt(v?.toString() ?? '0'),s,r,ethSignedMessage,true]
       })

       const hash =await createTransaction([
       {
        data:txDataReserveToUser,
        to:usdcAddress[this.chainId],
        value:"0",
       },
       {
        data:txDataFundUsdc,
        to:contractAddress,
        value:"0"
       }
       ],"reserve",this.chainId)
       return hash
    }
}