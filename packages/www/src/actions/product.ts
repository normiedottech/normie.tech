"use server"
import { DOMAIN } from '@/lib/constants'
import { normieTechClient } from '@/lib/normie-tech'
import { db } from '@normietech/core/database/index'
import { apiKeys, payoutSettings, products, projectSettings, transactions, projects, plans  } from '@normietech/core/database/schema/index'
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
    const [settings,project] = await db.batch([
        db.query.projectSettings.findFirst({
            where:eq(projectSettings.projectId,transaction.projectId ?? "")
        }),
        db.query.projects.findFirst({
            where:eq(projects.projectId,transaction.projectId ?? "")
        })
    ])

    return {
        success:true,
        res:{transaction,settings,project},
        error:undefined
    }
}
export async function getProductCheckoutLink({projectId,productId,amount,payoutAddress}:{projectId:string,productId:string,amount?:number,payoutAddress?:string}): Promise<{success:boolean,error?:string,res?:any}> 
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
                payoutAddress:payoutAddress ?? payoutSetting.payoutAddress
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

// New function to get the color mode from payout settings
export async function getColorModeFromProject(projectId: string): Promise<string | null> {
    if (!projectId) {
      return null;
    }
    
    const projectSetting = await db.query.projectSettings.findFirst({
      where: and(
        eq(projectSettings.projectId, projectId),
       
      
      )
    });
  
    return projectSetting?.colorModeInCheckout || null;
  }

export async function getPlanById(planId: string) {
  try {
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
      with: {
        product: true,
        project: true,
      },

    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    if (!plan.amount) {
      return { error: "Plan price not set" };
    }

    // Get project settings
    const settings = await db.query.projectSettings.findFirst({
      where: eq(projectSettings.projectId, plan.projectId),
    });

    if (!settings?.activate_subscription) {
      return { error: "Subscriptions are not enabled for this project" };
    }

    // Get the PayPal plan details from metadata
    const paypalPlanId = plan.metadata?.paypalPlanId;
    if (!paypalPlanId) {
      return { error: "PayPal plan ID not found" };
    }

    return {
      plan: plan,
      product: plan.product,
      projectId: plan.projectId,
      settings,
    };
  } catch (error) {
    console.error('Error fetching plan details:', error);
    return { error: 'Failed to fetch plan details' };
  }
}