import { Hono } from "hono";
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { metadataStripeSchema } from "@/utils";
import Stripe from "stripe";
import { Resource } from "sst";
import {
  parseProjectRegistryKey,
  payoutMetadataSchema,
  PROJECT_REGISTRY,
  ProjectRegistryKey,
} from "@normietech/core/config/project-registry/index";
import { getPayoutSettings, getProjectBalanceById, getProjectById } from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import { sleep } from "@normietech/core/util/sleep";
import { and, eq, sql } from "drizzle-orm";
import {
  events,
  paymentUsers,
  payoutBalance,
  payoutSettings,
  projects,
  transactions,
  stripeFailedTransactions
} from "@normietech/core/database/schema/index";
import { ViaprizeWrapper } from "@normietech/core/viaprize/index";
import {
  createTransaction,
  sendTokenData,
  TransactionData,
} from "@normietech/core/wallet/index";
import { late, z } from "zod";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { nanoid } from "nanoid";

import { SarafuWrapper } from "@normietech/core/sarafu/index";
import { blockchainNamesSchema, ChainId, ChainIdSchema, USD_TOKEN_ADDRESSES, validBlockchains, validChainIds } from "@normietech/core/wallet/types";
import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
const stripeWebhookApp = new Hono();
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);

const getPaymentIntentDetails = async (paymentIntentId: string) => {
  const payload = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });

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
  const payoutSetting = await db.query.payoutSettings.findFirst({
    where: and(
      eq(payoutSettings.projectId, paymentIntentDetails.metadata.projectId),
      eq(payoutSettings.isActive, true)
    ),
  });
  if (!payoutSetting) {
    throw new Error("Payout settings not found");
  }

  const isInstant =
    payoutSetting.payoutPeriod === "instant" ||
    payoutSetting.settlementType === "smart-contract";
  
  const metadata = metadataStripeSchema.parse(paymentIntentDetails.metadata);

  if (metadata.stage !== Resource.App.stage) {
    return;
  }
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
  let finalPayoutAmount = transaction.finalAmountInFiat;
  let onChainTxId: string | undefined;
  const project = (await getProjectById(
    metadata.projectId
  )) as typeof projects.$inferSelect;
  if (project && !project.fiatActive) {
    throw new Error("Fiat payments are disabled for this project");
  }

  switch (metadata.projectId as ProjectRegistryKey) {
    case "sarafu": {
      const projectInfo = PROJECT_REGISTRY["sarafu"];
      const sarafuMetadataParsed = projectInfo.routes.checkout[0].bodySchema
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
      finalPayoutAmount =
        transaction.finalAmountInFiat - transaction.platformFeesInFiat;
      const sarafu = new SarafuWrapper(transaction.chainId);
      onChainTxId = await sarafu.deposit(
        sarafuMetadataParsed.poolAddress as `0x${string}`,
        BigInt(transaction.amountInToken)
      );
      break;
    }
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
      finalPayoutAmount =
        transaction.finalAmountInFiat - transaction.platformFeesInFiat;

      const viaprize = new ViaprizeWrapper();
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
      finalPayoutAmount =
        transaction.finalAmountInFiat - transaction.platformFeesInFiat;

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
    default: {
      if (project.settlementType === "smart-contract") {
        throw new Error(
          "Smart contract settlement not supported for this project"
        );
      }
      if (!payoutSetting.payoutAddress) {
        throw new Error(
          "No payout address provided, payout address required for this project"
        );
      }
      let payoutAddress = payoutSetting.payoutAddress;

      const { data: checkoutMetadata, success } =
        payoutMetadataSchema.safeParse(transaction.metadataJson);
      if (
        success &&
        checkoutMetadata.payoutAddress.toLowerCase() !==
          payoutAddress.toLowerCase()
      ) {
        payoutAddress = checkoutMetadata.payoutAddress;
      }
      const finalTransactions = [] as TransactionData[];
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
      finalPayoutAmount =
        transaction.finalAmountInFiat - transaction.platformFeesInFiat;

      if (project.referral) {
        const referralProject = await getProjectById(project.referral);
        const referralSettings = await getPayoutSettings(project.referral);
        if (referralProject && referralSettings.payoutAddress) {
          transaction.referralFeesInFiat =
            transaction.platformFeesInFiat -
            removePercentageFromNumber(
              transaction.platformFeesInFiat,
              project.referralPercentage
            );
          transaction.platformFeesInFiat = removePercentageFromNumber(
            transaction.platformFeesInFiat,
            project.referralPercentage
          );
          transaction.referral = project.referral;
        }
      }
    
      if (isInstant && validChainIds.includes(payoutSetting.chainId as any) && validBlockchains.includes(payoutSetting.blockchain)) {
        const validBlockchainName = blockchainNamesSchema.parse(payoutSetting.blockchain);
        const validChainId = ChainIdSchema.parse(payoutSetting.chainId);
        finalTransactions.push({
          data: sendTokenData(payoutAddress, transaction.amountInToken),
          to: USD_TOKEN_ADDRESSES[validBlockchainName],
          value: "0",
        });
   
        onChainTxId = await createTransaction(
          finalTransactions,
          "reserve",
          validChainId
        );
        break;
      }
      break;
    }
  }

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
  const balance = await getProjectBalanceById(metadata.projectId);
  await db.batch([
    db
      .update(transactions)
      .set({
        ...transaction,
        platformFeesInFiat: parseFloat(
          transaction.platformFeesInFiat?.toFixed(3) ?? "0"
        ),
        blockchainTransactionId: onChainTxId,
        status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
        paymentUserId: userId,
        paymentIntent: paymentIntent,
      })
      .where(eq(transactions.id, metadata.metadataId)),
    db
      .update(payoutBalance)
      .set({
        balance: isInstant
          ? balance.balance + 0
          : balance.balance + finalPayoutAmount,
        paidOut: isInstant
          ? balance.paidOut + finalPayoutAmount
          : balance.paidOut + 0,
      })
      .where(eq(payoutBalance.projectId, metadata.projectId)),
  ]);
};

const handlePaymentLinkTransaction = async (
  metadata: z.infer<typeof metadataStripeSchema>,
  paymentIntent: string
) => {
  const project = (await getProjectById(
    metadata.projectId
  )) as typeof projects.$inferSelect;

  const paymentIntentDetails = await getPaymentIntentDetails(paymentIntent);
  const payoutSetting = await db.query.payoutSettings.findFirst({
    where: and(
      eq(payoutSettings.projectId, metadata.projectId),
      eq(payoutSettings.isActive, true)
    ),
  })
  
  if (!payoutSetting) {
    throw new Error("Payout settings not found");
  }
  const metadataId = nanoid(14);
  const decimals = await getDecimalsOfToken(payoutSetting.blockchain, USD_TOKEN_ADDRESSES[payoutSetting.blockchain], payoutSetting.chainId);
  await db.insert(transactions).values({
    blockChainName: payoutSetting.blockchain,
    projectId: metadata.projectId,
    paymentId: "0",
    chainId: payoutSetting.chainId,
    amountInFiat: paymentIntentDetails.amount / 100,
    id: metadataId,
    paymentIntent: paymentIntent,
    token: USD_TOKEN_ADDRESSES[payoutSetting.blockchain],
    status: "fiat-confirmed",
    currencyInFiat: "USD",
    decimals: decimals
  });
  await stripeClient.paymentIntents.update(paymentIntent, {
    metadata: {
      ...metadata,
      metadataId,
    },
  });
};
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
      console.log("Charge updated");
      if (webhookEvent.data.object.payment_intent === null) {
        return c.json({ error: "No payment intent provided" }, 400);
      }
      await sleep(3000);
      await handleOnChainTransaction(
        webhookEvent.data.object.payment_intent.toString()
      );
    break;

    case "payment_intent.payment_failed":
      const paymentIntent = webhookEvent.data.object;
      console.log("Payment failed for payment intent:", paymentIntent);
      const paymentIntentMetadata = paymentIntent.metadata;
      console.log({ paymentIntentMetadata });

      if (!paymentIntentMetadata.projectId) {
        console.log("No metadata found, skipping...");
        return c.json({ error: "No metadata found" });
      }
      await db.insert(stripeFailedTransactions).values({
        id: paymentIntent.id,
        productId: paymentIntentMetadata.projectId,
        failureMessage: paymentIntent.last_payment_error?.message || "Unknown error",
        amount: paymentIntent.amount,
      });
      console.log("Failed transaction saved to database");
    break;

    case "checkout.session.completed":
      if (webhookEvent.data.object.payment_intent === null) {
        return c.json({ error: "No payment intent provided" }, 400);
      }
      const metadata = metadataStripeSchema.parse(
        webhookEvent.data.object.metadata
      );
      console.log({ metadata });
      if (metadata.stage !== Resource.App.stage) {
        return c.json(
          { message: "Success, not your stage , not your webhook" },
          200
        );
      }
        
      switch (metadata.paymentType) {
        case "paymentLink":
          await handlePaymentLinkTransaction(
            metadata,
            webhookEvent.data.object.payment_intent.toString()
          );
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
