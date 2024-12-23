import { and, eq } from "drizzle-orm"
import { db } from "./database"
import { createTransaction, sendToken, sendTokenData } from "./wallet"
import { blockchainNamesSchema, ChainIdSchema, USD_TOKEN_ADDRESSES, validBlockchains, validChainIds } from "./wallet/types"
import { evmClient, getDecimalsOfToken } from "./blockchain-client"
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
        if(!settings.payoutAddress){
            throw new Error('Payout address not set')
        }
        if(payout.balance < 50){
            throw new Error('Minimum payout amount is 50 USD')
        }
        if(!validBlockchains.includes(settings.blockchain) && !validChainIds.includes(settings.chainId as any)){
            throw new Error('Blockchain not supported')
        }
        const balance = payout.balance - 10
        const validChainId = ChainIdSchema.parse(settings.chainId)
        const validBlockchain =blockchainNamesSchema.parse(settings.blockchain)
        const tokenAddress = USD_TOKEN_ADDRESSES[validBlockchain]
        const decimals =  await getDecimalsOfToken(validBlockchain,tokenAddress,validChainId)
        const valueInTokens = (balance * 10 ** decimals)
        console.log('valueInTokens',valueInTokens)
        const hash = await sendToken(settings.payoutAddress,valueInTokens,validBlockchain,validChainId)
        if(hash){
            await db.batch([
                db.update(payoutBalance).set({
                    balance:payout.balance - payout.balance,
                    paidOut:payout.paidOut + payout.balance,

    
                }).where(eq(payoutBalance.projectId,this.projectId)),
                db.insert(payoutTransactions).values({
                    payoutSettings:settings.id,
                    projectId:this.projectId,
                    amountInFiat:balance,
                    onChainTransactionId:hash,
                    status:"confirmed-onchain",
                    platFromFeesInFiat:10
                })
            ])
        }
        
        return hash
       
    }
}