import { Hono } from "hono";
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { metadataStripeSchema } from "@/utils";
import Stripe from "stripe";
import { Resource } from "sst";
import {
  parseProjectRegistryKey,
  PROJECT_REGISTRY,
  ProjectRegistryKey,
} from "@normietech/core/config/project-registry/index";
import {
  getProjectById
} from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import {
  paymentUsers,
  projects,
  transactions,
} from "@normietech/core/database/schema/index";
import { ViaprizeWrapper } from "@normietech/core/viaprize/index";
import {
  createTransaction,
  sendToken,
  usdcAddress,
} from "@normietech/core/wallet/index";
import { late, z } from "zod";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { nanoid } from "nanoid";
const stripeWebhookApp = new Hono();
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);

const getPaymentIntentDetails = async (paymentIntentId: string) => {
  const payload = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });
  console.log({ payload }, "payloaddd");
  return {
    ...payload,
    latest_charge: {
      ...(payload.latest_charge as Stripe.Charge),
      balance_transaction: (payload.latest_charge as Stripe.Charge)
        .balance_transaction as Stripe.BalanceTransaction,
    },
  };
};
const handleOnChainTransaction = async (paymentIntent: string) => {
  const paymentIntentDetails = await getPaymentIntentDetails(paymentIntent);
  console.log(paymentIntentDetails.metadata,"metadata") 
  const metadata = metadataStripeSchema.parse(paymentIntentDetails.metadata);
  console.log({ metadata }, "metadata"); 
  if (!metadata.metadataId) {
    throw new Error("No metadataId provided");
  }
  let transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, metadata.metadataId),
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  let finalFiatAmountInCents =
    paymentIntentDetails.latest_charge.balance_transaction.net;
  let feesByPaymentProcessorInCents =
    paymentIntentDetails.latest_charge.balance_transaction.fee;
  transaction.paymentProcessFeesInFiat = feesByPaymentProcessorInCents / 100;
  transaction.finalAmountInFiat = finalFiatAmountInCents / 100;
  let onChainTxId: string | undefined;
  const project  = await getProjectById(metadata.projectId) as typeof projects.$inferSelect;

  switch (metadata.projectId as ProjectRegistryKey) {
    case "viaprize": {
      const projectInfo = PROJECT_REGISTRY["viaprize"];
      const viaprizeMetadataParsed = projectInfo.routes.checkout[0].bodySchema
        .pick({ metadata: true })
        .parse({
          metadata: transaction.metadataJson,
        }).metadata;
      transaction.amountInToken = removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      );
      transaction.platformFeesInFiat =
        transaction.finalAmountInFiat -
        removePercentageFromNumber(
          transaction.finalAmountInFiat,
          project.feePercentage
        );

      const viaprize = new ViaprizeWrapper(transaction.chainId);
      onChainTxId = await viaprize.fundPrize(
        viaprizeMetadataParsed.userAddress as `0x${string}`,
        viaprizeMetadataParsed.contractAddress as `0x${string}`,
        BigInt(transaction.amountInToken),
        viaprizeMetadataParsed.deadline,
        viaprizeMetadataParsed.signature as `0x${string}`,
        viaprizeMetadataParsed.ethSignedMessage as `0x${string}`
      );
      break;
    }
    case "voice-deck": {
      const projectId = "voice-deck";
      const projectInfo = PROJECT_REGISTRY[projectId];
      transaction.amountInToken = removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      );
      transaction.platformFeesInFiat =
        transaction.finalAmountInFiat -
        removePercentageFromNumber(
          transaction.finalAmountInFiat,
          project.feePercentage
        );

      const voiceDeckMetadata = projectInfo.routes.checkout[0].bodySchema
        .pick({ metadata: true })
        .parse({
          metadata: transaction.metadataJson,
        }).metadata;
      voiceDeckMetadata.amountApproved = transaction.amountInToken;
      const hypercert = new HypercertWrapper(
        voiceDeckMetadata.chainId,
        "reserve"
      );
      try {
        onChainTxId = await hypercert.buyHypercert(
          voiceDeckMetadata.order,
          voiceDeckMetadata.recipient,
          BigInt(voiceDeckMetadata.amount),
          BigInt(voiceDeckMetadata.amountApproved)
        );
      } catch (error) {
        throw new Error("Failed to process hypercert transaction");
      }
      break;
    }
    default:{
      if(project.settlementType === "smart-contract"){
        throw new Error("Smart contract settlement not supported for this project");
      }
      if(!project.payoutAddressOnEvm){
        throw new Error("No payout address provided, payout address required for this project");
      }
      transaction.amountInToken = removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      );
      transaction.platformFeesInFiat =
        transaction.finalAmountInFiat -
        removePercentageFromNumber(
          transaction.finalAmountInFiat,
          project.feePercentage
        );
      onChainTxId = await sendToken(
        project.payoutAddressOnEvm,
        transaction.amountInToken,
        usdcAddress[10],
        10
      );
      break;
    }
  }
  if (onChainTxId) {
    const user = await db.query.paymentUsers.findFirst({
      where: and(
        eq(paymentUsers.projectId, metadata.projectId),
        eq(paymentUsers.email, paymentIntentDetails.receipt_email ?? "")
      ),
    });

    let userId: string | undefined;
    if (!user && paymentIntentDetails.latest_charge.billing_details.name) {
      userId = (
        await db
          .insert(paymentUsers)
          .values({
            email: paymentIntentDetails.latest_charge.billing_details.email,

            name: paymentIntentDetails.latest_charge.billing_details.name,
            projectId: metadata.projectId,
          })
          .returning({ id: paymentUsers.id })
      )[0].id;
    }
    await db
      .update(transactions)
      .set({
        ...transaction,
        platformFeesInFiat: parseFloat(
          transaction.platformFeesInFiat?.toFixed(3) ?? "0"
        ),
      })
      .where(eq(transactions.id, metadata.metadataId));
    await db
      .update(transactions)
      .set({
        blockchainTransactionId: onChainTxId,
        status: "confirmed-onchain",
        paymentUserId: userId,
        paymentIntent: paymentIntent,
      })
      .where(eq(transactions.id, metadata.metadataId));
  }
};

const handlePaymentLinkTransaction = async ( metadata: z.infer<typeof metadataStripeSchema>,
  paymentIntent: string) => {
  const project = await getProjectById(metadata.projectId) as typeof projects.$inferSelect;
  if(!project.payoutAddressOnEvm){
    throw new Error("No payout address provided, payout address required for payment link transactions");
  }
  console.log({metadata})
  console.log({paymentIntent},"paymentIntent")
  const paymentIntentDetails = await getPaymentIntentDetails(paymentIntent);
  const metadataId = nanoid(14)
  await db.insert(transactions).values({
    blockChainName:"optimism",
    projectId:metadata.projectId,
    paymentId:"0",
    chainId:10,
    amountInFiat:paymentIntentDetails.amount / 100,
    id:metadataId,
    currencyInFiat:"USD"
  })
  await stripeClient.paymentIntents.update(paymentIntent, {
    metadata:{
      ...metadata,
      metadataId
    },
  }); 


}
const handleOnCheckoutSessionCompleted = async (
  metadata: z.infer<typeof metadataStripeSchema>,
  paymentIntent: string
) => {
  if (!metadata.metadataId) {
    throw new Error("No metadataId provided");
  }
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, metadata.metadataId),
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  await stripeClient.paymentIntents.update(paymentIntent, {
    metadata,
  });
  await db
    .update(transactions)
    .set({
      status: "fiat-confirmed",
    })
    .where(eq(transactions.id, metadata.metadataId));
};

// Stripe webhook route
stripeWebhookApp.post("/", async (c) => {
 
  const signature = c.req.header("Stripe-Signature");
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
  console.log(
    `=======================================EVENT-${webhookEvent.type}-WEBHOOK=======================================`
  );
  switch (webhookEvent.type) {
    case "charge.updated":
      console.log("charge.updated", webhookEvent.data.object);
      if (webhookEvent.data.object.payment_intent === null) {
        return c.json({ error: "No payment intent provided" }, 400);
      }
      await handleOnChainTransaction(
        webhookEvent.data.object.payment_intent.toString()
      );
      break;
    case "checkout.session.completed":
      if (webhookEvent.data.object.payment_intent === null) {
        return c.json({ error: "No payment intent provided" }, 400);
      }
      const metadata = metadataStripeSchema.parse(webhookEvent.data.object.metadata)
      switch(metadata.paymentType){
        case "paymentLink":
          await handlePaymentLinkTransaction(metadata, webhookEvent.data.object.payment_intent.toString());
          break;
        case "checkout":
          await handleOnCheckoutSessionCompleted(
            metadata,
            webhookEvent.data.object.payment_intent.toString()
          );
          break;
      }
      break;
  }
  return c.json({ message: "Success" }, 200);
});

// Export the stripeWebhookApp as default for serverless deployment compatibility
export default stripeWebhookApp;
