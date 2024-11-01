import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {HypercertWrapper} from "@normietech/core/hypercerts/index"
import {metadataStripeSchema,  withHandler} from "@/utils"
import Stripe from "stripe";
import { Resource } from "sst";
import { parseProjectRegistryKey, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import { paymentUsers, transactions } from "@normietech/core/database/schema/index";
export const post: APIGatewayProxyHandlerV2 = withHandler(async (event,ctx) => {

  console.log(
    '=======================================EVENT-STRIPE-WEBHOOK=======================================',
  )
  console.log("headers",event.headers)
  const signature = event.headers['Stripe-Signature']
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
      console.log({metadata})
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
          const voiceDeckMetadata = (project.routes.checkout[0].bodySchema.pick({metadata:true}).parse({
            metadata:voiceDeckRawMetadata?.metadataJson
          })).metadata
          console.log({voiceDeckMetadata})
          
          const hypercert = new HypercertWrapper(voiceDeckMetadata.chainId,"reserve")
         
          const txId = await hypercert.buyHypercert(
              voiceDeckMetadata.order,
              voiceDeckMetadata.recipient,
              BigInt(voiceDeckMetadata.amount),
              BigInt(voiceDeckMetadata.amountApproved )
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
    return {    
        statusCode: 200,
        body: "success",
    };
});