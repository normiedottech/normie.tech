import { and, eq } from "drizzle-orm"
import { db } from "./database"
import { createTransaction } from "./wallet"
import { blockchainNamesSchema, ChainIdSchema, USD_TOKEN_ADDRESSES } from "./wallet/types"
import { evmClient } from "./blockchain-client"
import { erc20Abi } from "viem"
import { payoutBalance, payoutSettings, payoutTransactions } from "./database/schema"

export class Payout {
    projectId: string
    constructor(projectId: string) {
        this.projectId = projectId
    }
    async triggerOnChainPayout() {
        const [settings,payout]  = await db.batch([
            db.query.payoutSettings.findFirst({
                where:and(
                    eq(payoutSettings.projectId,this.projectId),
                    eq(payoutSettings.isActive,true)
                )
            }),
            db.query.payoutBalance.findFirst({
                where:eq(payoutBalance.projectId,this.projectId)
            })
            ]
        )
        if(!settings){
            throw new Error('Payout settings not found')
        }
        if(!payout){
            throw new Error('Payout balance not found')
        }
      
        if(!settings.chainId){
            throw new Error('Chain id not set')
        }
        if(settings.blockchain!=="arbitrum-one" && settings.chainId!==42161){
            throw new Error('Blockchain not supported')
        }
        const validChainId = ChainIdSchema.parse(settings.chainId)
        const validBlockchain =blockchainNamesSchema.parse(settings.blockchain)
        const tokenAddress = USD_TOKEN_ADDRESSES[validBlockchain]
        const decimals =  await evmClient(validChainId).readContract({
            abi: erc20Abi,
            functionName: "decimals",
            address: tokenAddress as `0x${string}`,
          });
        const hash = await createTransaction([
            {
                to:settings.payoutAddress as `0x${string}`,
                value:(payout.balance * 10 ** decimals).toString(),
                data:"0x"
            }
        ],"reserve",validChainId)
        await db.batch([
            db.update(payoutBalance).set({
                balance:payout.balance - payout.balance,
                paidOut:payout.paidOut + payout.balance,

            }).where(eq(payoutBalance.projectId,this.projectId)),
            db.insert(payoutTransactions).values({
                payoutSettings:settings.id,
                projectId:this.projectId,
                amountInFiat:payout.balance,
                onChainTransactionId:hash,
                status:"confirmed-onchain"
            })
        ])
        return hash
       
    }
}