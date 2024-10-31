import { ethers,BytesLike } from "ethers";
import { encodeFunctionData } from "viem/utils"
import {BaseWallet} from "ethers/wallet"
import { ChainId ,WalletType,} from "../wallet/types";
import { createTransaction, getRPC, getSigner } from "../wallet/index"
import { HypercertExchangeClient, Maker } from "@hypercerts-org/marketplace-sdk";
import { erc20Abi } from "viem";
import { LOOKS_RARE_PROTOCOL } from "../abi";
export interface HypercertOrder extends  Maker{
    signature:string
}
export class HypercertWrapper {
    chainId:ChainId;
    rpcUrl:string;
    client:HypercertExchangeClient;
    constructor(chainId:ChainId,walletType:WalletType){
        this.chainId = chainId;
        this.rpcUrl = getRPC(chainId);
        const provider = new ethers.JsonRpcProvider(this.rpcUrl);
        const signingKey = new ethers.Wallet(getSigner(walletType));
        if(chainId === 42161){
            throw new Error("Arbitrum or chain id 42161 is not supported")
        }
        this.client = new HypercertExchangeClient(chainId,provider,signingKey);
        
    }

    async buyHypercert(order:HypercertOrder,recipient:string,amount:bigint,approvalAmount:bigint){
        console.log("addresesess",this.client.addresses)
        const takerOrder = this.client.createFractionalSaleTakerBid(order,recipient,amount,order.price)
        console.log(this.client.addresses.EXCHANGE_V2)
        const approveTxData = encodeFunctionData({
            abi:erc20Abi,
            functionName:"approve",
            args:[this.client.addresses.EXCHANGE_V2,approvalAmount]
        })
        // console.log({approveTxData})    
  
      
        const orderTx = encodeFunctionData({
            abi:LOOKS_RARE_PROTOCOL,
            functionName:"executeTakerBid",
            args:[
                {
                    additionalParameters:takerOrder.additionalParameters as `0x${string}`,
                    recipient:takerOrder.recipient as `0x${string}`,
                },
                {
                    additionalParameters:order.additionalParameters as `0x${string}`,
                    amounts:order.amounts as bigint[],
                    collection:order.collection as `0x${string}`,
                    collectionType:order.collectionType,
                    currency:order.currency as `0x${string}`,
                    endTime:order.endTime as bigint,
                    globalNonce:order.globalNonce as bigint,
                    itemIds:  order.itemIds as bigint[],
                    orderNonce:order.orderNonce as bigint,
                    price:order.price as bigint,
                    quoteType:order.quoteType,
                    signer:order.signer as `0x${string}`,
                    startTime:order.startTime as bigint,
                    strategyId:BigInt(order.strategyId.valueOf()),
                    subsetNonce:order.subsetNonce as bigint,

                },
                order.signature as `0x${string}`,
                {
                    proof:[],
                    root:"0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ]
        })
      
        const approveTx = await createTransaction([
            {
                to:order.currency,
                data:approveTxData,
                value:"0"
            },
            {
                data:orderTx,
                to:this.client.addresses.EXCHANGE_V2,
                value:"0"
            }
        ],"reserve",this.chainId)
        
        return approveTx;
    }
}