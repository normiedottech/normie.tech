import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {HypercertWrapper} from "@normietech/core/hypercerts/index"
import {metadataStripeSchema, withErrorHandling} from "../../utils"
import Stripe from "stripe";
import { Resource } from "sst";
import { parseProjectRegistryKey, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/project-registry/index";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import { paymentUsers, transactions } from "@normietech/core/database/schema/index";
export const post: APIGatewayProxyHandlerV2 = withErrorHandling(async (event,ctx) => {

  console.log(
    '=======================================EVENT-STRIPE-WEBHOOK=======================================',
  )
  const signature = event.headers['stripe-signature']
  if(!signature){
    throw new Error("No signature provided")
  }
  if(!event.body){
    throw new Error("No body provided")
  }
  const webhookEvent = Stripe.webhooks.constructEvent(
    event.body,
    signature,
    Resource.PaymentWebhookForId.secret,
  )
  switch (webhookEvent.type) {
    case 'checkout.session.completed': {
      const metadata = metadataStripeSchema.parse(webhookEvent.data.object.metadata)
      switch (metadata.projectId as ProjectRegistryKey) {
        case 'voice-deck':{
          if(!metadata.metadataId){
            throw new Error("No metadataId provided")
          }
          const voiceDeckRawMetadata = await db.query.transactions.findFirst({
            where: eq(transactions.id, metadata.metadataId),
          })
          const projectId = parseProjectRegistryKey(metadata.projectId)
          const project = PROJECT_REGISTRY[projectId]
          const voiceDeckMetadata = project.stripeMetadataSchema.parse(voiceDeckRawMetadata?.metadataJson)
          const hypercert = new HypercertWrapper(voiceDeckMetadata.chainId,"reserve")
          const txId = await hypercert.buyHypercert(
              voiceDeckMetadata.order,
              voiceDeckMetadata.recipient,
              BigInt(voiceDeckMetadata.amount),
              BigInt(voiceDeckMetadata.amountApproved)
          )
          console.log('=======================================TX-ID=======================================')
          if(txId){
            const user = await  db.query.paymentUsers.findFirst({
                where:and(eq(paymentUsers.projectId,projectId),eq(paymentUsers.email,webhookEvent.data.object.customer_email ?? ""))
            })
            let userId : string | undefined;
            if(!user && webhookEvent.data.object.customer_email){
                userId = (await db.insert(paymentUsers).values({
                    email:webhookEvent.data.object.customer_details?.email,
                    name:webhookEvent.data.object.customer_details?.name,
                    projectId:projectId
                }).returning({id:paymentUsers.id}))[0].id
            }
            await db.update(transactions).set({
                blockchainTransactionId: txId,
                status:"confirmed-onchain",
                paymentUserId:userId
            }).where(eq(transactions.id, metadata.metadataId))
          }
          
        }
      }
    }
  }

  // console.log("donnnnenenen")
  //   const hypercert = new HypercertWrapper(10,"reserve")
  //   await hypercert.buyHypercert(
  //       {
            
   
  //           quoteType: 1,
  //           globalNonce: "0",
  //           orderNonce: "0",
  //           strategyId: 1,
  //           collectionType: 2,
  //           collection: "0x822F17A9A5EeCFd66dBAFf7946a8071C265D1d07",
  //           currency: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  //           signer: "0xD8813c65a4A21772C360f32B2C7960040fa84a8B",
  //           startTime: 1729229169,
  //           endTime: 3313501199,
  //           price: "12",
  //           signature: "0x5d6c6b720ded1b3c41d3ea12dd4215a2da72417e88f00fe7b2238616ec35cee13f27e8cb4bf80db3021a427e1d6543ae5292e9c4a3f5097f1215722e25a00e631c",
  //           additionalParameters: "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          
  //           subsetNonce: 0,
  //           itemIds: [
  //             "18666869802181921290210340839884508775841793"
  //           ],
  //           amounts: [
  //             1
  //           ],
  //     },"0x8b5E4bA136D3a483aC9988C20CBF0018cC687E6f",BigInt(83333),BigInt(1 * 1_000_000)
  //   )
    
    return {    
        statusCode: 200,
        body: "pong",
    };
});