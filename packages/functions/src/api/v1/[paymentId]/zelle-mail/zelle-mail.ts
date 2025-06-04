import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { privateKeyToAddress, generatePrivateKey } from "viem/accounts";
import { AESCipher } from "@normietech/core/util/encryption";
import { Resource } from "sst";
import { db } from "@normietech/core/database/index";
import { liquidityProviders, transactions, zelleTransactions, zellePaymentsMetadata } from "@normietech/core/database/schema/index";
import { eq, and, gte } from "drizzle-orm";
import { ChainId } from "@normietech/core/wallet/types";
import { CustodialWallet, getAddress } from "@normietech/core/wallet/index";
import { createHmac } from "crypto";
import { sleep } from "@normietech/core/util/sleep";
import { bus } from "sst/aws/bus";
import { WebhookEvents } from "@normietech/core/event";

const app = new Hono();
const SIGNING_SECRET = "hYC3CJ3V8C92bHMw3PuRhEKk2V8EofoFrl40GNKpLJ7MaFkK";


// Schema for creating a new LP
const createLPSchema = z.object({
  email: z.string().email().optional(),
  zelleId: z.string().optional(),
  zelleName: z.string().optional(),
  paymentProcessorId: z.string().optional(),
});

const transferFundsSchema = z.object({
  zelleId: z.string(),
});

// Schema for zelle payment webhook
const zellePaymentWebhookSchema = z.object({
  mailbox_id: z.string(),
  doc_id: z.string(),
  event: z.literal('doc.parsed'),
  payload: z.object({
    filename: z.string(),
    template_id: z.string(),
    parsed: z.object({
      name: z.string(),
      sent_date: z.string(),
      transaction_number: z.string(),
      zelleEmail: z.string().email(),
      amount: z.string(),
      created_at: z.string()
    })
  })
});

// Create a new LP
app.post("/lp", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = createLPSchema.parse(body);

    // Generate a new private key
    const privateKey = generatePrivateKey();
    const walletAddress = privateKeyToAddress(privateKey);

    // Encrypt the private key
    const cipher = new AESCipher(Resource.ENCRYPTION_KEY.value);
    const encryptedKey = cipher.encrypt(privateKey);

    // Create the LP record
    const [lp] = await db.insert(liquidityProviders).values({
      walletAddress,
      walletKey: encryptedKey,
      email: validatedData.email,
      zelleId: validatedData.zelleId,
      zelleName: validatedData.zelleName
    }).returning();

    return c.json({
      success: true,
      data: {
        id: lp.id,
        walletAddress: lp.walletAddress,
        email: lp.email,
        zelleId: lp.zelleId,
        zelleName: lp.zelleName,
        paymentProcessorId: lp.paymentProcessorId,
        createdAt: lp.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating LP:", error);
    return c.json({ success: false, error: "Failed to create LP" }, 500);
  }
});

const confirmTransactionSchema = z.object({
  transactionId: z.string(),
})

app.post('/confirm',async (c) => {
  const body = await c.req.json();
  const validatedData = confirmTransactionSchema.parse(body);
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, validatedData.transactionId)
  });
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  if (!transaction.projectId) {
    return c.json({ error: "Project Id not found" }, 404);
  }
  if (transaction.amountInFiat === null) {
    return c.json({ error: "Transaction amount is not set" }, 400);
  }
  if (transaction.lock) {
    return c.json({ error: "Transaction is locked" }, 400);
  }
  if (transaction.status === "confirmed-onchain") {
    return c.json({ error: "Transaction is already confirmed onchain" }, 400);
  }
  await sleep(10000)
  if(transaction.status === "pending"){
    const zelleTransaction = await db.query.zelleTransactions.findFirst({
      where: and(
        eq(zelleTransactions.amount, transaction.amountInFiat),
        gte(zelleTransactions.createdAt, new Date(Date.now() - 12 * 60 * 60 * 1000))
      )
    });
    if(!zelleTransaction){
      return c.json({ error: "Zelle transaction not found" }, 404);
    }
    await db.update(zelleTransactions).set({
      transactionId: transaction.id
    }).where(eq(zelleTransactions.id, zelleTransaction.id));
    await db.update(transactions).set({
      status: "fiat-confirmed"
    }).where(eq(transactions.id, transaction.id));
  }
  const newTransaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transaction.id),
  });
  await bus.publish(
    Resource.WebhookEventBusV1.name,
    WebhookEvents.Transaction.FiatConfirmed,
    {
      metadata: {
        projectId: transaction.projectId,
        event: "transaction.fiatConfirmed"
      },
      transaction: newTransaction
    }
  )
  return c.json({ success: true });
});
const settleTransactionSchema = z.object({
  transactionId: z.string(),
});
app.post('/settle',async (c) => {
  const body = await c.req.json();
  const validatedData = settleTransactionSchema.parse(body);
  const latestTransaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, validatedData.transactionId),
  });
  if (!latestTransaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }

  if(!latestTransaction.projectId) {
    return c.json({error: "project id not found"}, 404)
  }

  if (!latestTransaction.lock) {
    return c.json({ error: "Transaction is not locked" }, 400);
  }
  


  

});
app.post('/transfer-funds', async (c) => {
  const body = await c.req.json();
  const validatedData = transferFundsSchema.parse(body);

  const lp = (await db.select().from(liquidityProviders).where(eq(liquidityProviders.zelleId, validatedData.zelleId)))[0];
  if (!lp) {
    return c.json({ success: false, error: "LP not found" }, 404);
  }
  if (!lp.walletKey) {
    return c.json({ success: false, error: "LP wallet key not found" }, 404);
  }
  const custodialWallet = new CustodialWallet(lp.walletKey, 137);
  const tokenBalance = await custodialWallet.tokenBalance("0xc2132D05D31c914a87C6611C10748AEb04B58e8F");
  const tokenDecimals = 6;
  const formattedTokenBalance = Number(tokenBalance) / 10 ** tokenDecimals;
  if (formattedTokenBalance <= 0) {
    return c.json({ success: false, error: "LP wallet balance is too low" }, 400);
  }
  const transfer = await custodialWallet.transferToken(
    getAddress("reserve"),
    tokenBalance.toString(),
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  )
  if(transfer){
    await db.update(liquidityProviders).set({
      liquidityInFiat: lp.liquidityInFiat + Number(formattedTokenBalance)
    }).where(eq(liquidityProviders.id, lp.id));
  }
  return c.json({ hash: transfer });
});

// Get LP by ID
app.get("/lp/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [lp] = await db.select().from(liquidityProviders).where(eq(liquidityProviders.id, id));

    if (!lp) {
      return c.json({ success: false, error: "LP not found" }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: lp.id,
        walletAddress: lp.walletAddress,
        email: lp.email,
        zelleId: lp.zelleId,
        zelleName: lp.zelleName,
        paymentProcessorId: lp.paymentProcessorId,
        createdAt: lp.createdAt,
        updatedAt: lp.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching LP:", error);
    return c.json({ success: false, error: "Failed to fetch LP" }, 500);
  }
});

// List all LPs
app.get("/lp", async (c) => {
  try {
    const lps = await db.select().from(liquidityProviders);

    return c.json({
      success: true,
      data: lps.map((lp: typeof liquidityProviders.$inferSelect) => ({
        id: lp.id,
        walletAddress: lp.walletAddress,
        email: lp.email,
        zelleId: lp.zelleId,
        zelleName: lp.zelleName,
        paymentProcessorId: lp.paymentProcessorId,
        createdAt: lp.createdAt,
        updatedAt: lp.updatedAt
      })),
    });
  } catch (error) {
    console.error("Error listing LPs:", error);
    return c.json({ success: false, error: "Failed to list LPs" }, 500);
  }
});

// Zelle payment received webhook
app.post('/zelle-payment-received', async (c) => {
  const signature = c.req.header('parsio-signature');
  const rawBody = await c.req.raw.text();
  const hmac = createHmac('sha256', SIGNING_SECRET);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('base64');

  if (signature !== expectedSignature) {
    return c.json({ error: 'Invalid signature' }, 403);
  }

  try {
    const validatedData = zellePaymentWebhookSchema.parse(JSON.parse(rawBody)); 
    const transaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.status, "pending"),
        gte(transactions.createdAt, new Date(Date.now() - 12 * 60 * 60 * 1000)),
        eq(transactions.amountInFiat, Number(validatedData.payload.parsed.amount)),
        eq(transactions.projectId, "zelle-phoenix")
      )
    });
    console.log({validatedData, transaction})
    await db.insert(zelleTransactions).values({
      internalTransactionId: validatedData.payload.parsed.transaction_number,
      zelleId: validatedData.payload.parsed.zelleEmail,
      amount: Number(validatedData.payload.parsed.amount),
      currency: "USD"
    });
    if(transaction){
      await db.update(transactions).set({
        status: "fiat-confirmed"
      }).where(eq(transactions.id, transaction.id));
      await db.update(zelleTransactions).set({
        transactionId: transaction.id
      }).where(eq(zelleTransactions.internalTransactionId, validatedData.payload.parsed.transaction_number));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Zelle payment webhook error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/zelle-details', async (c) => {
  try {
    console.log("zelle-pheonix-payment-details-update")
    const { transactionId } = await c.req.json<{ transactionId: string }>()
    if (!transactionId) {
      return c.json(
        { error: 'Transaction ID is required' },
        400
      );
    }
    const transaction = await db.query.transactions.findFirst({ 
      where: eq(transactions.id, transactionId)
    })
    if (!transaction) {
      return c.json({
        success: false,
        error: "Transaction not found"
      }, 404)
    }
    if (!transaction.amountInFiat) {
      return c.json({
        success: false,
        error: "Transaction amount not found"
      }, 404)
    }
    if (transaction.status === "fiat-confirmed" || transaction.status === "confirmed-onchain") {
      return c.json({
        success: false,
        error: "Transaction already confirmed"
      }, 400)
    }
    const zelleMetadata = await db.query.zellePaymentsMetadata.findFirst({
      where: eq(zellePaymentsMetadata.transactionId, transactionId)
    })
    if (!zelleMetadata) {
      return c.json({
        success: false,
        error: "Zelle payment metadata not found"
      }, 404)
    }
    if (zelleMetadata.confirmationStatus === "payment-confirmed-by-admin" || zelleMetadata.confirmationStatus === "payment-confirmed-by-sender") {
      return c.json({
        success: false,
        error: "Zelle payment metadata is not in wait-for-payment-details status"
      }, 400)
    }

    const generateUniqueAmount = async (baseAmount: number, attempt: number = 0): Promise<{ amount: number, randomAmount: number }> => {
      if (attempt >= 3) {
        throw new Error("Could not generate unique amount after 3 attempts");
      }

      // Generate random amount between 1-30 cents
      const randomCents = Math.floor(Math.random() * 30) + 1;
      const adjustedAmount = baseAmount + (randomCents / 100);

      // Check if this amount exists in the last 12 hours
      const existingTransaction = await db.query.zelleTransactions.findFirst({
        where: and(
          eq(zelleTransactions.amount, adjustedAmount),
          gte(zelleTransactions.createdAt, new Date(Date.now() - 12 * 60 * 60 * 1000))
        )
      });

      if (existingTransaction) {
        // If amount exists, try again with a different random amount
        return generateUniqueAmount(baseAmount, attempt + 1);
      }

      return { amount: adjustedAmount, randomAmount: randomCents / 100 };
    };

    // Apply 1.5% offset to the base amount
    const baseAmount = transaction.amountInFiat;
    const offsetAmount = baseAmount * 0.985; // 1.5% offset

    const { amount: finalAmount, randomAmount } = await generateUniqueAmount(offsetAmount);

    // Generate a unique order ID
    const orderId = nanoid(20);

    await db.batch([
      db.update(zellePaymentsMetadata).set({
        confirmationStatus: "wait-for-payment-details",
        payoutDetails: "",
        amount: finalAmount,
        uniquenessAmount: randomAmount
      }).where(eq(zellePaymentsMetadata.transactionId, transactionId)),
      db.update(transactions).set({
        amountInFiat: finalAmount,
        externalPaymentProviderId: orderId,
      }).where(eq(transactions.id, transactionId))
    ]);

    return c.json({
      success: true,
      data: {
        orderId: orderId,
        status: "pending",
        amount: finalAmount,
        recipientAddress: "zelle-phoenix",
        createdAt: new Date().toISOString(),
        verificationMethod: "teller-zelle-payment-verified-by-seller",
        orderFulfillment: null,
        orderVerification: null
      }
    });
  } catch (error) {
    console.error('Error processing payment details:', error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process payment details' 
      },
      500
    );
  }
});

export default app; 