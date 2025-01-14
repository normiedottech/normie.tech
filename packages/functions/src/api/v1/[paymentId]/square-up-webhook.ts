import { Hono } from "hono";
import { WebhooksHelper,WebhookSubscription, WebhookSubscriptionsApi,Payment,EventData} from "square";
import type { UpdatePaymentResponse,Event, OrderUpdated } from "square"
import { squareClient } from "../[projectId]/[paymentId]/payments/squreup-checkout";
import { metadataSquareSchema, metadataStripeSchema } from "@/utils";
import { paymentUsers, payoutBalance, payoutSettings, projects, transactions } from "@normietech/core/database/schema/index";
import { z } from "zod";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import { Resource } from "sst";
import { sleep } from "@normietech/core/util/sleep";
import { getPayoutSettings, getProjectBalanceById, getProjectById } from "@normietech/core/config/project-registry/utils";
import { payoutMetadataSchema, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { SarafuWrapper } from "@normietech/core/sarafu/index";
import { ViaprizeWrapper } from "@normietech/core/viaprize/index";
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { createTransaction, sendTokenData, TransactionData } from "@normietech/core/wallet/index";
import { ChainIdSchema, validChainIds, validBlockchains, blockchainNamesSchema, USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { bus } from "sst/aws/bus";
import { InternalEvents } from "@normietech/core/event";
type EventDataType = "order.updated" | "payment.updated"
function isFromSquare(signature:string, body:string) {
    return WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        Resource.SQUARE_WEBHOOK_SECRET.value,
        `${Resource["API-V1"].url}/v1/payment/1/webhook`,
      );
}


const squareUpWebhookApp = new Hono();
squareUpWebhookApp.post("/", async (c) => {
    const signature = c.req.header('x-square-hmacsha256-signature');
    const body = await c.req.text();

    if (!signature) { 
        return c.json({error:"No signature  provided"},400)
    }
    if(!isFromSquare(signature,body)){
        return c.json({error:"Invalid signature"},400)
    }

    const event =  JSON.parse(body) as Event
    // console.log({event})
    const eventData = event.data as EventData
    console.log(`========== EVENT TYPE :${event.type}=========================`)
    switch(event.type as EventDataType){
        
        case "payment.updated":{

            const paymentID = (eventData.object as Payment).id
            console.log({paymentID})
            console.log({eventData})
            console.log(eventData.object,"object")
            const paymentResponse = await squareClient.paymentsApi.getPayment((eventData as any)?.object?.payment.id)
            if(paymentResponse.result && paymentResponse.result.payment?.status === "COMPLETED"){
                const orderResponse = await squareClient.ordersApi.retrieveOrder(((eventData.object as any)?.payment?.order_id  as string) ?? "")
                const metadata = metadataSquareSchema.parse(orderResponse.result.order?.metadata)
                if(metadata.stage !== Resource.App.stage){
                    return c.json({error:"Invalid stage"},200)
                }
                if(!metadata.metadataId){
                    return c.json({error:"No metadata Id provided"},400)
                }
                const transaction = await db.query.transactions.findFirst({
                    where:eq(transactions.id,metadata.metadataId)
                })
                if(!transaction){
                    return c.json({error:"Transaction not found"},400)
                }
                if(transaction.status !== "confirmed-onchain"){
                    await bus.publish(
                        Resource.InternalEventBus.name,
                        InternalEvents.SquareUp.OnChainTransactionConfirm,
                        {
                          metadata,
                          payment: paymentResponse.result.payment
                        }
                      )
                    console.log("completed and also done this part")
                }
                
                
                console.log("completed")

            }   
            // return c.json({success:true})         
            break;
        }
    }


    
    return c.json({success:true})

})
export default squareUpWebhookApp;