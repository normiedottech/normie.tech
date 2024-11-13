import { Hono } from 'hono';
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { metadataStripeSchema } from "@/utils";
import Stripe from "stripe";
import { Resource } from "sst";
import { parseProjectRegistryKey, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import { paymentUsers, transactions } from "@normietech/core/database/schema/index";

const stripeWebhookApp = new Hono();
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);

// Stripe webhook route
stripeWebhookApp.post('/', async (c) => {
  console.log('=======================================EVENT-STRIPE-WEBHOOK=======================================');
  console.log("headers", c.req.header);

  const signature = c.req.header('Stripe-Signature');
  if (!signature) {
    return c.json({ error: "No signature provided" }, 400);
  }

  const body = await c.req.text();
  if (!body) {
    return c.json({ error: "No body provided" }, 400);
  }

  let webhookEvent;
  try {
    webhookEvent = stripeClient.webhooks.constructEvent(
      body,
      signature,
      Resource.PaymentWebhookForId.secret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.json({ error: "Webhook signature verification failed" }, 400);
  }

  if (webhookEvent.type === 'checkout.session.completed') {
    const metadata = metadataStripeSchema.parse(webhookEvent.data.object.metadata);
    console.log({ metadata });

    switch (metadata.projectId as ProjectRegistryKey) {
      case 'voice-deck': {
        if (!metadata.metadataId) {
          return c.json({ error: "No metadataId provided" }, 400);
        }

        const voiceDeckRawMetadata = await db.query.transactions.findFirst({
          where: eq(transactions.id, metadata.metadataId),
        });

        if (!voiceDeckRawMetadata) {
          return c.json({ error: "Transaction not found" }, 404);
        }

        const projectId = 'voice-deck'
        const project = PROJECT_REGISTRY[
          'voice-deck'
        ];
        const voiceDeckMetadata = project.routes.checkout[0].bodySchema.pick({ metadata: true }).parse({
            metadata: voiceDeckRawMetadata.metadataJson,
        }).metadata;
      

        const hypercert = new HypercertWrapper(voiceDeckMetadata.chainId, "reserve");
        
        try {
          const txId = await hypercert.buyHypercert(
            voiceDeckMetadata.order,
            voiceDeckMetadata.recipient,
            BigInt(voiceDeckMetadata.amount),
            BigInt(voiceDeckMetadata.amountApproved)
          );
          console.log('=======================================TX-ID=======================================');

          if (txId) {
            const user = await db.query.paymentUsers.findFirst({
              where: and(eq(paymentUsers.projectId, projectId), eq(paymentUsers.email, webhookEvent.data.object.customer_email ?? ""))
            });

            let userId: string | undefined;
            if (!user && webhookEvent.data.object.customer_email) {
              userId = (await db.insert(paymentUsers).values({
                email: webhookEvent.data.object.customer_details?.email,
                name: webhookEvent.data.object.customer_details?.name,
                projectId: projectId,
              }).returning({ id: paymentUsers.id }))[0].id;
            }

            await db.update(transactions).set({
              blockchainTransactionId: txId,
              status: "confirmed-onchain",
              paymentUserId: userId,
            }).where(eq(transactions.id, metadata.metadataId));
          }
          
        } catch (error) {
          console.error("Error processing hypercert transaction:", error);
          return c.json({ error: "Failed to process hypercert transaction" }, 500);
        }

        break;
      }

      default:
        return c.json({ error: "Unhandled projectId in webhook" }, 400);
    }
  }

  return c.json({ message: "Success" }, 200);
});

// Export the stripeWebhookApp as default for serverless deployment compatibility
export default stripeWebhookApp;
