import { evmClient } from "@normietech/core/blockchain-client/index";
import { checkoutBodySchema, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import { transactions, wallets } from "@normietech/core/database/schema/index";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { CustodialWallet, usdcAddress, Wallet } from "@normietech/core/wallet/index";
import { ChainId } from "@normietech/core/wallet/types";
import { eq } from "drizzle-orm";
import { Resource } from "sst";
import Stripe from "stripe";
import { erc20Abi } from "viem";
import {z} from "zod"
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);

export const stripeCheckoutRefund =  async (projectId:ProjectRegistryKey,transactionId:string,refundAmountInCents:number) => {
  const payment = await db.query.transactions.findFirst({
    where:eq(transactions.id,transactionId)
  })
  if(!payment){
    throw new Error("Payment not found")
  }
  if(!payment.amountInFiat){
    throw new Error("Payment amount not found")
  }
  if(!payment.chainId){
    throw new Error("Payment chainId not found")
  }
  if(payment.paymentId !== "0"){
    throw new Error("Payment not supported")
  }
  if(!payment.paymentIntent){
    throw new Error("Payment intent not found for stripe")
  }
  const wallet = await db.query.wallets.findFirst({
    where:eq(wallets.projectId,projectId)
  })
  if(!wallet){
    throw new Error("Wallet not found")
  }
  if(!wallet.key){
    throw new Error("Wallet key not found")
  }
  const totalAmountRefundable = payment.amountInFiat * 100;
  if(refundAmountInCents > totalAmountRefundable){
    throw new Error("Refund amount exceeds total amount")
  }
  
  const custodialWallet = new  CustodialWallet(wallet.key,payment.chainId  as ChainId);
  const tokenBalance = await custodialWallet.tokenBalance(payment.token)
  const refundAmountInDecimals = parseInt(((refundAmountInCents / 100) *  10 ** payment.decimals).toString());
  if(parseInt(tokenBalance.toString()) < refundAmountInDecimals){
    throw new Error("Insufficient balance in wallet")
  }
  const refundResponse = await stripeClient.refunds.create({
    reason: "requested_by_customer",
    amount:refundAmountInCents,
    payment_intent: payment.paymentIntent,
  })
  await custodialWallet.transferToken(
    Wallet.getAddress("reserve"),
    payment.amountInToken.toString(),
    payment.token
  )
  return refundResponse

}
export const stripeCheckout = async (rawBody:string,body:z.infer<typeof checkoutBodySchema>,projectId: ProjectRegistryKey,transaction: typeof transactions.$inferInsert | undefined,metadataId:string ) => {
    
    let newTransaction =  {...transaction};
    switch(projectId){
        case "voice-deck":{
            const metadata = PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(body).metadata;
            const decimals = await evmClient(metadata.chainId).readContract({
                abi: erc20Abi,
                functionName: "decimals",
                address: metadata.order.currency as `0x${string}`,
            });
            
            newTransaction = {        
                    ...transaction,
                    chainId: metadata.chainId,
                    metadataJson: JSON.stringify(metadata),
                    amountInFiat: body.amount / 100,
                    currencyInFiat: "USD",
                    token: metadata.order.currency,
                    amountInToken: metadata.amountApproved,
                    decimals: decimals,
            }
        }
        case "viaprize":{
          const metadata = PROJECT_REGISTRY["viaprize"].routes.checkout[0].bodySchema.parse(body).metadata;
          const decimals = await evmClient(body.chainId).readContract({
              abi: erc20Abi,
              functionName: "decimals",
              address: metadata.tokenAddress as `0x${string}`,
          });
          newTransaction = {        
                  ...transaction,
                  chainId: body.chainId,
                  metadataJson: JSON.stringify(metadata),
                  amountInFiat: body.amount / 100,
                  currencyInFiat: "USD",
                  token: metadata.tokenAddress,
                  amountInToken: metadata.amountApproved,
                  decimals: decimals,
          }
        }
        case "lectron":{
          const project = PROJECT_REGISTRY["lectron"];
          const metadata = project.routes.checkout[0].bodySchema.parse(body).metadata;
          const decimals = await evmClient(body.chainId).readContract({
              abi: erc20Abi,
              functionName: "decimals",
              address: usdcAddress[10] as `0x${string}`,
          });
          const finalAmountInToken = parseInt((removePercentageFromNumber((body.amount / 100) - project.feeAmount,project.feePercentage) * 10 ** decimals).toString());
          newTransaction = {        
            ...transaction,
            chainId: body.chainId,
            metadataJson: JSON.stringify(metadata),
            amountInFiat: body.amount / 100,
            currencyInFiat: "USD",
            token: usdcAddress[10],
            amountInToken: finalAmountInToken,
            decimals: decimals,
          }
          
        }
        case "noahchonlee":{
          const project = PROJECT_REGISTRY["noahchonlee"];
          const metadata = project.routes.checkout[0].bodySchema.parse(body).metadata;
          const decimals = await evmClient(body.chainId).readContract({
              abi: erc20Abi,
              functionName: "decimals",
              address: usdcAddress[10] as `0x${string}`,
          });
          const finalAmountInToken = parseInt((removePercentageFromNumber((body.amount / 100) - project.feeAmount,project.feePercentage) * 10 ** decimals).toString());
          newTransaction = {        
            ...transaction,
            chainId: body.chainId,
            metadataJson: JSON.stringify(metadata),
            amountInFiat: body.amount / 100,
            currencyInFiat: "USD",
            token: usdcAddress[10],
            amountInToken: finalAmountInToken,
            decimals: decimals,
          }
        }
       
    }
    const session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        success_url: body.success_url,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                description: body.description,
                name: body.name,
                images: body.images,
              },
              unit_amount: body.amount,
            },
            quantity: 1,
          },
        ],
        customer_email:body.customerEmail && body.customerEmail!=="" ? body.customerEmail :undefined,
        metadata: {
          metadataId: metadataId,
          projectId: projectId,
        }
    });
   

    return {session,newTransaction};
}