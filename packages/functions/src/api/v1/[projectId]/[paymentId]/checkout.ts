import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { parseProjectRegistryKey, PROJECT_REGISTRY } from "@normietech/core/project-registry/index";
import {
  parsePaymentRegistryId,
  PAYMENT_REGISTRY,
} from "@normietech/core/payment-registry/index";
import { z } from "zod";
import {
  assertNotNull,
  withHandler,
} from "@/utils";
import Stripe from "stripe";
import { db } from "@normietech/core/database/index";
import { transactions, transactionsInsertSchema } from "@normietech/core/database/schema/index";
import {eq} from "drizzle-orm"
import { evmClient } from "@normietech/core/blockchain-client/index"
import { erc20Abi } from "viem";
import { nanoid } from "nanoid";


const bodySchema = z.object({
  description: z.string().optional(),
  name: z.string(),
  images: z.array(z.string()).optional(),
  amount: z
    .number()
    .min(50, { message: "Amount must be at least 50 i.e $0.5" })
    .max(1000000, {
      message: "Amount must be at most 10000000 in cents i.e $100000",
    }),
  success_url: z.string().url(),
  metadata: z.any(),
  chainId:z.number(),
  blockChainName:z.string().optional().default("evm"),
  customerEmail:z.string().email().optional(),
});
export const post: APIGatewayProxyHandlerV2 = withHandler(
  async (_event, ctx, callback) => {
    const pathParameters = assertNotNull(
      _event.pathParameters,
      "Missing path parameters"
    );
    const projectId = parseProjectRegistryKey(pathParameters.projectId);
    const paymentId = parsePaymentRegistryId(pathParameters.paymentId);
    const paymentRegistry = PAYMENT_REGISTRY[paymentId];
    const stripeClient = new Stripe(paymentRegistry.apiKey);
    const body = bodySchema.parse(JSON.parse(_event.body ?? "{}"));
    
    let transaction : typeof transactions.$inferInsert | undefined;
    transaction = {
        blockChainName:body.blockChainName,
    }
    const metadataId = nanoid(13)
    switch (projectId) {
        
        case "voice-deck": {
            const metadata = PROJECT_REGISTRY[projectId].stripeMetadataSchema.parse(body.metadata);
            const decimals = await evmClient(metadata.chainId).readContract({
                abi:erc20Abi,
                functionName:"decimals",
                address:metadata.order.currency as `0x${string}`,
            })
            transaction = {
                ...transaction,
                chainId:metadata.chainId,
                metadataJson: JSON.stringify(metadata),
                amountInFiat:body.amount / 100,
                currencyInFiat:"USD",
                token:metadata.order.currency,
                amountInToken:metadata.amountApproved,
                decimals:decimals,
                id:metadataId,
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
      customer_email: body.customerEmail,
      
      metadata:{
        metadataId:metadataId,
        projectId:projectId,
      }
    });
    const finalTransaction = transactionsInsertSchema.parse(transaction);
    await db.insert(transactions).values(finalTransaction);
    if (session.url) {
      await db.update(transactions).set({
        externalPaymentProviderId: session.id,
      }).where(eq(transactions.id,metadataId));
    }
    return {
      body: JSON.stringify({
        projectId: projectId,
        paymentId: paymentId,
        url: session.url,
      }),
    };
  }
);
