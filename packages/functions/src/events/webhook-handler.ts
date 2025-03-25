import { db } from "@normietech/core/database/index";
import { webhooks, WebhookEventsSchema, WebhookEventType, webhookDeliveries } from "@normietech/core/database/schema/index";
import { eq, sql, and } from 'drizzle-orm';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { bus } from 'sst/aws/bus';
import { WebhookEvents, metadataWebhook } from "@normietech/core/event";
import { z } from 'zod';


async function sendWebhook(webhook: typeof webhooks.$inferSelect, eventType: WebhookEventType, payload: z.infer<typeof metadataWebhook>) : Promise<void> {

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

      const webhookDelivery = {
        id: nanoid(15),
        webhookId: webhook.id,
        eventType,
        payload: payloadString,
        responseStatus: response.status,
        responseBody: await response.text(),
        responseHeaders: (() => {
          const headersObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
          return headersObj;
        })(),
        attemptCount: attempt,
        responseTime: Date.now() - startTime,
        successfull: response.ok,
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
    WebhookEvents.Transaction.Created,
    WebhookEvents.Transaction.OnChainConfirmed,
    WebhookEvents.Transaction.FiatConfirmed,
  ], async(event: {metadata: z.infer<typeof metadataWebhook>}) => {

    const projectId = event.metadata.projectId;
    const eventType = event.metadata.event;

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
            sql`${eventType} = ANY(${webhooks.events})`
          )
      );

      if(relevantWebhooks.length === 0){
        throw new Error(`No relevant webhooks found for projectId: ${projectId} and event type: ${eventType} OR webhooks are inactive`)
      }
      
      await Promise.all(
        relevantWebhooks.map((webhook) => (
          sendWebhook(webhook, eventType, event.metadata)
        ))
      )
      
      console.log(`Webhooks sent for projectId: ${projectId} and event type: ${eventType}`)
        
    } catch (error) {
      console.log(`Failed to send webhooks ${error}`);
      throw new Error(`Failed to send webhooks ${error}`)
    }
  }
)