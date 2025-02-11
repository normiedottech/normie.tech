import { Hono } from 'hono';
import { checkoutBodySchema, parseProjectRegistryKey, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";
import { parsePaymentRegistryId, PAYMENT_REGISTRY } from "@normietech/core/config/payment-registry/index";
import { z } from "zod";
import {  withHandler } from "@/utils";

import { db } from "@normietech/core/database/index";
import { transactions, transactionsInsertSchema } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";

import { nanoid } from "nanoid";

import { stripeCheckout } from './payments/stripe-checkout';
import { getPayoutSettings, getProjectById } from '@normietech/core/config/project-registry/utils';
import { squareCheckout } from './payments/squreup-checkout';
import { paypalCheckout } from './payments/paypal-checkout';

const checkoutApp = new Hono();


// Route for processing transaction and creating a Stripe checkout session
checkoutApp.post('/', withHandler(async (c) => {
  const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();
  
  if (!projectIdParam || !paymentIdParam) {
    return c.json({ error: "Missing path parameters" }, 400);
    }
    const projectId = await parseProjectRegistryKey(projectIdParam);
    const paymentId = parsePaymentRegistryId(paymentIdParam);  
    const payoutSetting = await getPayoutSettings(projectId);
    const project = await getProjectById(projectId)
    const bodyRaw = await  c.req.json()
    let body = checkoutBodySchema.parse(bodyRaw);
  
    const metadataId = body.customId || nanoid(20);

    if(project && !project.fiatActive){
      return c.json({ error: "Fiat payments are disabled for this project" }, 400);
    }
    if(!body.blockChainName){
      body.blockChainName = payoutSetting.blockchain
    }
    if(!body.chainId){
      body.chainId = payoutSetting.chainId
    }

    let transaction: typeof transactions.$inferInsert | undefined = {
      blockChainName: body.blockChainName,
      projectId: projectId,
      paymentId: paymentId,
      extraMetadataJson: JSON.stringify(body.extraMetadata),
      chainId: body.chainId,
      amountInFiat: body.amount / 100,
      currencyInFiat: "USD",
      id: metadataId,
    };
    let url : string | undefined | null;
    let externalId : string | undefined | null;
    switch (paymentId){
      case "0":{
        // const session = await stripeCheckout(
        //   bodyRaw,
        //   body,
        //   projectId,
        //   transaction,
        //   metadataId
        // )
        const session = await paypalCheckout(
       
          body,
          projectId,
          transaction,
          metadataId
        )
        if(!session.result){
          throw new Error("Error creating session, result  is undefined")
         
        }

        url = session?.result.links;
        externalId = session?.result.id;
        transaction = session?.newTransaction;
      }
    }

    const finalTransaction = transactionsInsertSchema.parse(transaction);
    await db.insert(transactions).values(finalTransaction);

    if (url) {
      await db.update(transactions)
        .set({ externalPaymentProviderId: externalId })
        .where(eq(transactions.id, metadataId));
    }

    return c.json({
      projectId: projectId,
      paymentId: paymentId,
      url: url,
      transactionId: metadataId,
    }, 200);
 
}));

// Export the checkoutApp as default for serverless deployment compatibility
export default checkoutApp;
