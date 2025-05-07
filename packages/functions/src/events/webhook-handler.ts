import { db } from "@normietech/core/database/index";
import { webhooks, WebhookEventsSchema, WebhookEventType, webhookDeliveries, transactionsInsertSchema } from "@normietech/core/database/schema/index";
import { eq, sql, and } from 'drizzle-orm';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { bus } from 'sst/aws/bus';
import { InternalEvents, WebhookEvents, metadataWebhook } from "@normietech/core/event";
import { z } from 'zod';
import { sendMessage, Telegram } from "@normietech/core/telegram";
import { Resource } from "sst";


async function sendWebhook(webhook: typeof webhooks.$inferSelect, eventType: WebhookEventType, payload: any) : Promise<void> {

  const maxRetries = webhook.maxRetriesPerMinute;
  const payloadString = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const signature = createHmac('sha256', webhook.secret)
    .update(payloadString)
    .digest('hex');
  
  headers['X-Signature'] = signature;
  

  for (let attempt=1; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      const response = await fetch(webhook.endpoint, {
        method: 'POST',
        headers,
        body: payloadString
      });

      console.log(response)

      const webhookDelivery = {
        id: nanoid(15),
        webhookId: webhook.id,
        eventType,
        payload: payloadString,
        statusCode: response.status,
        responseBody: await response.text(),
        responseHeaders: (() => {
          const headersObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
          return headersObj;
        })(),
        attemptCount: attempt,
        durationMs: Date.now() - startTime,
        successful: response.ok,
        error: response.ok ? null : "Delivery failed",
      }

      await db.insert(webhookDeliveries).values(webhookDelivery);

      if(response.ok) {
        await db
          .update(webhooks)
          .set({ successCount: sql`${webhooks.successCount} + 1` })
          .where(eq(webhooks.id, webhook.id));
        return;
      }

      if(attempt === maxRetries) {
        await db
          .update(webhooks)
          .set({ failureCount: sql`${webhooks.failureCount} + 1` })
          .where(eq(webhooks.id, webhook.id));
      }

    } catch (error) {
        const delivery = {
          id: nanoid(15),
          webhookId: webhook.id,
          eventType,
          payload,
          statusCode: null,
          responseBody: null,
          responseHeaders: null,
          attemptCount: attempt,
          responseTime: Date.now() - startTime,
          successful: false,
          error: error instanceof Error ? error.message : "unknown error while sending webhooks",
        };

        await db.insert(webhookDeliveries).values(delivery);

        if (attempt === maxRetries) {
          await db
            .update(webhooks)
            .set({ failureCount: sql`${webhooks.failureCount} + 1` })
            .where(eq(webhooks.id, webhook.id));
        }
    }
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}


export const handler = bus.subscriber(
  [
    WebhookEvents.Transaction.Pending,
    WebhookEvents.Transaction.OnChainConfirmed,
    WebhookEvents.Transaction.FiatConfirmed,
    WebhookEvents.Subscription.Created,
    WebhookEvents.Subscription.Updated,
    // WebhookEvents.Subscription.OnchainConfirmed,
    // WebhookEvents.Subscription.FiatConfirmed,
    WebhookEvents.Subscription.Cancelled
  ], async (event) => {

    switch(event.type){
      case "transaction.onChainConfirmed":{
        if(Resource.App.stage === "production"){
          await Telegram.sendMessage({
            chatId:"-4741491993",
            text:`⚠️ Got a transaction for ${event.properties.metadata.projectId} and $${event.properties.transaction.amountInFiat}`
          })
        }
        break;
      }
    }

    const projectId = event.properties.metadata.projectId;
    const eventType = event.properties.metadata.event;


    console.log(`Sending webhooks for projectId: ${projectId} and event type: ${eventType}`);

    if(!projectId || !eventType){
      throw new Error("Missing projectId or event type in webhook handler")
    }

    try {
      
      const relevantWebhooks = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.projectId, projectId),
            eq(webhooks.active, true),
            sql`${eventType} = ANY(SELECT jsonb_array_elements_text(${webhooks.events}))`
          )
      );

      if(relevantWebhooks.length === 0){
        console.log(`No relevant webhooks found for projectId: ${projectId} and event type: ${eventType} OR webhooks are inactive, so skipping sending webhooks`);
        return;
      }
      
      await Promise.all(
        relevantWebhooks.map((webhook) => (
          sendWebhook(webhook, eventType, event.properties)
        ))
      )
      
      console.log(`Webhooks sent for projectId: ${projectId} and event type: ${eventType}`)
        
    } catch (error) {
      console.log(`Failed to send webhooks ${error}`);
      throw new Error(`Failed to send webhooks ${error}`)
    }
  }
)