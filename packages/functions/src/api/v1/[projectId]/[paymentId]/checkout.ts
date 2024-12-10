import { Hono } from 'hono';
import { checkoutBodySchema, parseProjectRegistryKey, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";
import { parsePaymentRegistryId, PAYMENT_REGISTRY } from "@normietech/core/config/payment-registry/index";
import { z } from "zod";
import { assertNotNull, withHandler } from "@/utils";
import Stripe from "stripe";
import { db } from "@normietech/core/database/index";
import { transactions, transactionsInsertSchema } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { evmClient } from "@normietech/core/blockchain-client/index";
import { erc20Abi } from "viem";
import { nanoid } from "nanoid";
import { Resource } from "sst";
import { stripeCheckout } from './payments/stripe-checkout';
import { getProjectById } from '@normietech/core/config/project-registry/utils';

const checkoutApp = new Hono();


// Route for processing transaction and creating a Stripe checkout session
checkoutApp.post('/', withHandler(async (c) => {
  const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();

  if (!projectIdParam || !paymentIdParam) {
    return c.json({ error: "Missing path parameters" }, 400);
  }


    const projectId = await parseProjectRegistryKey(projectIdParam);
    const paymentId = parsePaymentRegistryId(paymentIdParam);
  

  
    const bodyRaw = await  c.req.json()
    console.log({bodyRaw})
    const body = checkoutBodySchema.parse(bodyRaw);

    const metadataId = body.customId || nanoid(20);

    const project = await getProjectById(projectId)
    if(project && !project.fiatActive){
      return c.json({ error: "Fiat payments are disabled for this project" }, 400);
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
        const session = await stripeCheckout(
          bodyRaw,
          body,
          projectId,
          transaction,
          metadataId
        )
        console.log({session})
        url = session.session.url;
        // console.log(session.session.payment_intent?.toString(),"session.session.payment_intent?.toString()")
        externalId = session.session.id
        transaction = session.newTransaction;
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
