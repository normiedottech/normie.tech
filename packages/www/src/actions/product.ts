"use server"
import { DOMAIN } from '@/lib/constants'
import { normieTechClient } from '@/lib/normie-tech'
import { db } from '@normietech/core/database/index'
import { apiKeys, payoutSettings, products, projectSettings, transactions } from '@normietech/core/database/schema/index'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
export type Product = typeof products.$inferSelect

export async function getProductById(productId: string) {
  return await db.query.products.findFirst({
    where: eq(products.id as any, productId)
  })
}


export async function getTransactionById(transactionId: string) {
    const transaction = await db.query.transactions.findFirst({
        where:eq(transactions.id,transactionId),
        with:{
           products:true,
           paymentUser:true
        }
    })
   
   
    if(!transaction){
        return {
            success:false,
            error:"Transaction not found",
            res:undefined
        }
    }
    const settings = await db.query.projectSettings.findFirst({
        where:eq(projectSettings.projectId,transaction.projectId ?? "")
    })

    return {
        success:true,
        res:{transaction,settings},
        error:undefined
    }
}
export async function getProductCheckoutLink({projectId,productId,amount}:{projectId:string,productId:string,amount?:number}): Promise<{success:boolean,error?:string,res?:any}> 
{   

   
    const [product,apiKey,payoutSetting] = await db.batch([
        db.query.products.findFirst({
            where:and(eq(products.projectId,projectId),eq(products.id,productId))
        }),
        db.query.apiKeys.findFirst({
            where:eq(apiKeys.projectId,projectId)
        }),
        db.query.payoutSettings.findFirst({
            where:and(eq(payoutSettings.projectId,projectId),eq(payoutSettings.isActive,true))
        })
    ])
    if(!product){
        return {success:false,error:"Product not found"}
    }
    if(!apiKey){
        return {success:false,error:"API Key not found"}
    }
    if(!payoutSetting || !payoutSetting.payoutAddress){
        return {success:false,error:"Payout settings not found"}
    }
    const customId = nanoid(20)
    const response = await normieTechClient.POST('/v1/{projectId}/0/checkout',{
        body:{
            name:product?.name ?? "Payment",
            description: product?.description ?? `Payment to ${product?.projectId}`,
            amount: product.priceInFiat ? product.priceInFiat * 100 : (amount ?? 0) * 100,
            success_url: `${DOMAIN}/checkout/success?transactionId=${customId}&projectId=${projectId}`, 
            customId,
            productId:productId,
            metadata:{
                payoutAddress:payoutSetting.payoutAddress
            }
        },
        params:{
            header:{
                "x-api-key":apiKey.apiKey
            },
            path:{
              projectId:projectId
            }
        }
    })

    if(response.error){
        return {success:false,error:`Failed to create checkout session: ${response.error}`}
    }
  

    

    return {success:true,res:response.data?.url,error:undefined}

}