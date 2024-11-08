import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { parseProjectRegistryKey, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";
import {
  parsePaymentRegistryId,
  PAYMENT_REGISTRY,
} from "@normietech/core/config/payment-registry/index";
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
import { Resource } from "sst";
export const post: APIGatewayProxyHandlerV2 = withHandler(
  async (_event, ctx, callback) => {
    const pathParameters = assertNotNull(
      _event.pathParameters,
      "Missing path parameters"
    );
    const projectId = parseProjectRegistryKey(pathParameters.projectId);
    const paymentId = parsePaymentRegistryId(pathParameters.paymentId);
    const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);
    console.log(_event.body)
    const body = PROJECT_REGISTRY[projectId].routes.checkout["default"].bodySchema.parse(JSON.parse(_event.body ?? "{}"));
  
    let transaction : typeof transactions.$inferInsert | undefined;
    transaction = {
        blockChainName:body.blockChainName,
        projectId:projectId,
        paymentId:paymentId,
        id:body.customId,
        extraMetadataJson:JSON.stringify(body.extraMetadata),
    }
    const metadataId = body.customId ? body.customId : nanoid(20)
    switch (projectId) {
        
        case "voice-deck": {
            const metadata = (PROJECT_REGISTRY[projectId].routes.checkout[paymentId].bodySchema.parse(body)).metadata;
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
      customer_email: body.customerEmail ? body.customerEmail : undefined,
      
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
      statusCode:200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify({
        projectId: projectId,
        paymentId: paymentId,
        url: session.url,
        transactionId: metadataId,
      }),
    };
  }
);
