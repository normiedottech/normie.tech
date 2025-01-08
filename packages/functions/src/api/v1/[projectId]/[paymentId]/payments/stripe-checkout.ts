import { evmClient, getDecimalsOfToken } from "@normietech/core/blockchain-client/index";

import {
  checkoutBodySchema,
  paymentLinkBodySchema,
  payoutMetadataSchema,
  PROJECT_REGISTRY,
  ProjectRegistryKey,
} from "@normietech/core/config/project-registry/index";
import { getPayoutSettings, getProjectById } from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import {
  projects,
  transactions,
  users,
  wallets,
} from "@normietech/core/database/schema/index";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import {
  CustodialWallet, 
  Wallet,
} from "@normietech/core/wallet/index";
import { blockchainNamesSchema, ChainId, USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { eq } from "drizzle-orm";
import { Resource } from "sst";
import Stripe from "stripe";
import { erc20Abi } from "viem";
import { z } from "zod";
import {SARAFU_CUSD_TOKEN} from "@normietech/core/sarafu/index"
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);
const identityClient = new Stripe(Resource.IDENTITY_STRIPE_API.value);
export const stripeVerificationSession = async (userId:string,successUrl:string) => {
  const user = await db.query.users.findFirst({
    where:eq(users.id,userId)
  })
  if(!user){
    throw new Error("User not found")
  }
  const session = await identityClient.identity.verificationSessions.create({
    client_reference_id:userId,
    metadata:{
      userId:userId,
      stage:Resource.App.stage,
      projectId:user.projectId
    },
    return_url:successUrl,

    verification_flow:Resource.App.stage === "production" ? "vf_1QXHSgCYSKQ1WsNQJJdLJymv":"vf_1QZ68NCYSKQ1WsNQBh4tyCbO",
  })
  return session
}
export const stripeCheckoutRefund = async (
  projectId: ProjectRegistryKey | string,
  transactionId: string,
  refundAmountInCents: number
) => {
  const payment = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });
  if (!payment) {
    throw new Error("Payment not found");
  }
  if (!payment.amountInFiat) {
    throw new Error("Payment amount not found");
  }
  if (!payment.chainId) {
    throw new Error("Payment chainId not found");
  }
  if (payment.paymentId !== "0") {
    throw new Error("Payment not supported");
  }
  if (!payment.paymentIntent) {
    throw new Error("Payment intent not found for stripe");
  }
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.projectId, projectId),
  });
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  if (!wallet.key) {
    throw new Error("Wallet key not found");
  }
  const totalAmountRefundable = payment.amountInFiat * 100;
  if (refundAmountInCents > totalAmountRefundable) {
    throw new Error("Refund amount exceeds total amount");
  }

  const custodialWallet = new CustodialWallet(
    wallet.key,
    payment.chainId as ChainId
  );
  const tokenBalance = await custodialWallet.tokenBalance(payment.token);
  const refundAmountInDecimals = parseInt(
    ((refundAmountInCents / 100) * 10 ** payment.decimals).toString()
  );
  if (parseInt(tokenBalance.toString()) < refundAmountInDecimals) {
    throw new Error("Insufficient balance in wallet");
  }
  const refundResponse = await stripeClient.refunds.create({
    reason: "requested_by_customer",
    amount: Math.floor(refundAmountInCents),
    payment_intent: payment.paymentIntent,
  });
  // await custodialWallet.transferToken(
  //   Wallet.getAddress("reserve"),
  //   refundAmountInDecimals.toString(),
  //   payment.token
  // );
  return refundResponse;
};
export const stripeCheckout = async (
  rawBody: string,
  body: z.infer<typeof checkoutBodySchema>,
  projectId: ProjectRegistryKey | string,
  transaction: typeof transactions.$inferInsert | undefined,
  metadataId: string
) => {
  let newTransaction = { ...transaction };

  newTransaction = {
    ...transaction,
    chainId: body.chainId,
    currencyInFiat: "USD",
    amountInFiat: body.amount / 100,
  };

  switch (projectId) {
    case "voice-deck": {
      const metadata =
        PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(
          body
        ).metadata;
      const decimals = await evmClient(metadata.chainId).readContract({
        abi: erc20Abi,
        functionName: "decimals",
        address: metadata.order.currency as `0x${string}`,
      });

      newTransaction = {
        ...newTransaction,
        chainId: body.chainId,
        metadataJson: JSON.stringify(metadata),
        token: metadata.order.currency,
        amountInToken: metadata.amountApproved,
        decimals: decimals,
      };
      break;
    }
    case "sarafu":{
      const metadata = PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(body).metadata;
      const decimals = await evmClient(body.chainId).readContract({
        abi: erc20Abi,
        functionName: "decimals",
        address: SARAFU_CUSD_TOKEN as `0x${string}`,
      });
      const finalAmountInToken = (body.amount / 100) * 10 ** decimals;
      newTransaction = {
        ...newTransaction,
        metadataJson: JSON.stringify(metadata),
        token: SARAFU_CUSD_TOKEN,
        amountInToken: finalAmountInToken,
        decimals: decimals,
      };
      break;
    }
    case "viaprize": {
      const metadata =
        PROJECT_REGISTRY["viaprize"].routes.checkout[0].bodySchema.parse(
          body
        ).metadata;
      const decimals = await evmClient(body.chainId).readContract({
        abi: erc20Abi,
        functionName: "decimals",
        address: metadata.tokenAddress as `0x${string}`,
      });
      newTransaction = {
        ...newTransaction,
        metadataJson: JSON.stringify(metadata),
        token: metadata.tokenAddress,
        amountInToken: metadata.amountApproved,
        decimals: decimals,
      };
      
      break;
    }
    case "noahchonlee": {
      const project = PROJECT_REGISTRY["noahchonlee"];
      const metadata =
        project.routes.checkout[0].bodySchema.parse(body).metadata;
      const decimals = await evmClient(body.chainId).readContract({
        abi: erc20Abi,
        functionName: "decimals",
        address: USD_TOKEN_ADDRESSES["optimism"] as `0x${string}`,
      });
      const finalAmountInToken = body.amount * 10 ** decimals;
      newTransaction = {
        ...newTransaction,
        metadataJson: JSON.stringify(metadata),
        token: USD_TOKEN_ADDRESSES["optimism"],
        amountInToken: finalAmountInToken,
        decimals: decimals,
      };
      break;
    }
    default: {
      const project = (await getProjectById(
        projectId
      )) as typeof projects.$inferSelect;
      if (project.settlementType === "smart-contract") {
        throw new Error("Smart contract settlement not supported");
      }
      
      const payoutSetting = await getPayoutSettings(projectId);
      const token = USD_TOKEN_ADDRESSES[blockchainNamesSchema.parse(payoutSetting.blockchain)];

      const metadata = payoutMetadataSchema.parse(body.metadata);
      const decimals = await getDecimalsOfToken(payoutSetting.blockchain, token, payoutSetting.chainId);
      
      const finalAmountInToken = body.amount * 10 ** decimals;
      newTransaction = {
        ...newTransaction,
        metadataJson: JSON.stringify(metadata),
        token: token,
        amountInToken: finalAmountInToken,
        decimals: decimals,
      };
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
    customer_email:
      body.customerEmail && body.customerEmail !== ""
        ? body.customerEmail
        : undefined,
    metadata: {
      metadataId: metadataId,
      projectId: projectId,
      paymentType: "checkout",
      stage: Resource.App.stage,
    },
    payment_intent_data: {
      metadata: {
        metadataId: metadataId,
        projectId: projectId,
        paymentType: "checkout",
        stage: Resource.App.stage,
      },
    },
  });


  return { session, newTransaction };
};
export const getStripePaymentLinks = async (projectId: string) => {
  const paymentLinks = await stripeClient.paymentLinks.list({
    
  });
  return paymentLinks;
}
export const stripePaymentLink = async (rawBody: string, projectId: string) => {
  const body = paymentLinkBodySchema.parse(rawBody);
  const metadata = { projectId,paymentType:"paymentLink",stage: Resource.App.stage};
  const price = await stripeClient.prices.create({
    currency: "usd",
    custom_unit_amount: {
      enabled: true,
      minimum: 1 * 100,
      maximum: 10000 * 100,
    },

    product_data: {
      name: body.name,
      metadata: metadata,
    },
  });

  const res = await stripeClient.paymentLinks.create({
    submit_type: "pay",
    metadata:{
      projectId:projectId,
      paymentType:"paymentLink",
      stage: Resource.App.stage
    },
    payment_intent_data: {
      metadata: {
        projectId: projectId,
        paymentType: "paymentLink",
        stage: Resource.App.stage,
      },
    },
    line_items: [
      {
        quantity: 1,
        price: price.id,
      },

    ],
  });
  
  return res
};
