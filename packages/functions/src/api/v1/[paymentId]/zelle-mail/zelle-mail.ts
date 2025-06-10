import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { privateKeyToAddress, generatePrivateKey } from "viem/accounts";
import { AESCipher } from "@normietech/core/util/encryption";
import { Resource } from "sst";
import { db } from "@normietech/core/database/index";
import { liquidityProviders, transactions, zelleTransactions, zellePaymentsMetadata, projects, referrers, payoutBalance, liquidityAndPayoutAddressesSettings } from "@normietech/core/database/schema/index";
import { eq, and, gte, lte } from "drizzle-orm";
import { blockchainNamesSchema, ChainId, ChainIdSchema, USD_TOKEN_ADDRESSES, validBlockchains, validChainIds } from "@normietech/core/wallet/types";
import { CustodialWallet, getAddress, routeTransaction, sendSolanaTokenTransaction, sendTokenData, TransactionData } from "@normietech/core/wallet/index";
import { createHmac } from "crypto";
import { sleep } from "@normietech/core/util/sleep";
import { bus } from "sst/aws/bus";
import { WebhookEvents } from "@normietech/core/event";
import {ZelleMail} from "@normietech/core/zelle-mail/index";
import { payoutMetadataSchema } from "@normietech/core/config/project-registry/index";
import { extractFeesFromAmountInFiat } from "@normietech/core/util/fees";
import { getPayoutSettings, getProjectById } from "@normietech/core/config/project-registry/utils";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
const app = new Hono();
const SIGNING_SECRET = Resource.EMAIL_PARSING_WEBHOOK_SECRET.value;
const settleTransactionSchema = z.object({
  transactionId: z.string(),
});
export const handleOnChainTransaction = async (
  transactionId: string,
  transaction: typeof transactions.$inferSelect,
  phoenixBody: z.infer<typeof settleTransactionSchema>
) => {
  let newTransaction = { ...transaction };
  const zelleTransaction = await db.query.zelleTransactions.findFirst({
    where: eq(zelleTransactions.transactionId, transactionId)
  })
  if(!zelleTransaction){
    throw new Error("Zelle transaction not found");
  }
  if(!zelleTransaction.zelleId){
    throw new Error("Zelle id not found");
  }
  const liquidityProvider = await db.query.liquidityProviders.findFirst({
    where: eq(liquidityProviders.zelleId, zelleTransaction.zelleId)
  })

  if(!liquidityProvider){
    throw new Error("Liquidity provider not found");
  }
  console.log("newTransaction", newTransaction)
  if (!transaction.projectId) {
    throw new Error("Project id not found");
  }
  const project = await db.query.projects.findFirst({
    where: eq(projects.projectId, transaction.projectId),
    with: {
      payoutSettings: true,
      projectSettings: true,
      payoutBalance: true,
    },
  });
  const zelleMetadata = await db.query.zellePaymentsMetadata.findFirst({
    where: eq(zellePaymentsMetadata.transactionId, transactionId),
  })
  const payoutSetting = project?.payoutSettings;
  const projectSetting = project?.projectSettings;
  const payoutBalanceOfProject = project?.payoutBalance;
  if (!payoutSetting || !projectSetting) {
    throw new Error("Payout or project setting not found");
  }
  if (!payoutBalanceOfProject) {
    throw new Error("Payout balance not found");
  }
  const isInstant =
    payoutSetting.payoutPeriod === "instant" ||
    payoutSetting.settlementType === "smart-contract";
  newTransaction.status = "fiat-confirmed";

  await db.batch([
    db
      .update(transactions)
      .set({
        ...newTransaction,
      })
      .where(eq(transactions.id, transactionId)),
  ]);

  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, newTransaction.referral ?? "")
  })
  const referrerPercentageCut = referrer?.percentageCut ?? 0;
  const uniquenessAmount = zelleMetadata?.uniquenessAmount ?? 0;
  const totalPercentage = project.feePercentage + liquidityProvider.feesPercentage;
  const amountInFiat = newTransaction.amountInFiat ?? 0;
  
  transaction.finalAmountInFiat = Number((amountInFiat * (1 - totalPercentage / 100)).toFixed(2));
  transaction.paymentProcessFeesInFiat = Number((amountInFiat * (liquidityProvider.feesPercentage / 100)).toFixed(2));
  transaction.platformFeesInFiat = Number((amountInFiat * (project.feePercentage / 100)).toFixed(2));
  console.log("transaction.finalAmountInFiat",transaction.finalAmountInFiat)
  console.log("transaction.paymentProcessFeesInFiat",transaction.paymentProcessFeesInFiat)
  console.log("transaction.platformFeesInFiat",transaction.platformFeesInFiat)
 

 
  let referralFees = 0;
  if (referrer) {
    referralFees = Number.parseFloat(((referrer.percentageCut / 100) * (transaction.amountInFiat ?? 0)).toFixed(2));


    if(referralFees > (transaction.platformFeesInFiat ?? 0)){
      throw new Error("Referral fees are greater than the additional fee");
    }
    transaction.referralFeesInFiat = referralFees;
  }

  let onChainTxId: string | undefined;
  switch (project.projectId) {
    default:
      {
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
        console.log("checkoutMetadata", checkoutMetadata)
        if (
          success &&
          checkoutMetadata.payoutAddress.toLowerCase() !==
          payoutAddress.toLowerCase()
        ) {
          payoutAddress = checkoutMetadata.payoutAddress;
        }
        console.log("payoutAddress", payoutAddress)
        const finalTransactions = [] as TransactionData[];
        transaction.amountInToken = Math.floor(
          parseFloat(
            (
              transaction.finalAmountInFiat *
              10 ** transaction.decimals
            ).toString()
          )
        );
        console.log("transaction.amountInToken", transaction.amountInToken);
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
        console.log(
          isInstant,
          validChainIds.includes(payoutSetting.chainId as any),
          validBlockchains.includes(payoutSetting.blockchain)
        );
        if (
          isInstant &&
          validChainIds.includes(payoutSetting.chainId as any) &&
          validBlockchains.includes(payoutSetting.blockchain)
        ) {
          const validBlockchainName = blockchainNamesSchema.parse(
            payoutSetting.blockchain
          );
          const validChainId = ChainIdSchema.parse(payoutSetting.chainId);
          switch (validBlockchainName) {
            case "solana":
            case "solana-devnet": {
              let finalTransaction = await sendSolanaTokenTransaction({
                amount: BigInt(transaction.amountInToken),
                from: getAddress("solana_reserve"),
                to: payoutAddress,
                token: USD_TOKEN_ADDRESSES[validBlockchainName],
                blockchain: validBlockchainName,
              });
              onChainTxId = await routeTransaction({
                blockchainName: validBlockchainName,
                chainId: validChainId,
                transactionData: [finalTransaction],
                type: "solana_reserve",
                settlementToken: {
                  address: USD_TOKEN_ADDRESSES[validBlockchainName],
                  amount: BigInt(transaction.amountInToken),
                  decimals: 6,
                },
              });
              break;
            }
            case "arbitrum-one":
            case "celo":
            case "ethereum":
            case "evm":
            case "optimism":
            case "polygon":
            case "base":
            case "base-sepolia":
            case "celo-alfajores":
            case "gnosis":
            case "sepolia-eth": {
              finalTransactions.push({
                data: sendTokenData(payoutAddress, transaction.amountInToken),
                to: USD_TOKEN_ADDRESSES[validBlockchainName],
                value: "0",
              });
              console.log("finalTransactions", finalTransactions);

              onChainTxId = await routeTransaction({
                blockchainName: validBlockchainName,
                chainId: validChainId,
                transactionData: finalTransactions,
                type: "reserve",
                settlementToken: {
                  address: USD_TOKEN_ADDRESSES[validBlockchainName],
                  amount: BigInt(transaction.amountInToken),
                  decimals: transaction.decimals,
                },
                origin: {
                  originBlockchain: "base",
                  originChainId: 8453
                }
              });
              break;
            }
            case "nile-tron":
            case "tron":
              throw new Error("Tron is not supported");
          }
        }
        break;
      }


      break;
  }
  const finalBatches = [] as any[];
  if (referrer) {
    finalBatches.push(db.update(referrers).set({
      totalVolume: referrer.totalVolume + (transaction.amountInFiat ?? 0),
      amountEarned: referrer.amountEarned + referralFees,
    }).where(eq(referrers.referralId, newTransaction.referral ?? "")));
  }
  

  await db.batch([
    db.update(liquidityProviders).set({
      liquidityInFiat:(liquidityProvider.liquidityInFiat - (((100 - liquidityProvider.feesPercentage) / 100) * (transaction.amountInFiat ?? 0)))
    }).where(eq(liquidityProviders.id, liquidityProvider.id)),
    db
      .update(transactions)
      .set({
        ...transaction,
        blockchainTransactionId: onChainTxId,
        status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
        paymentProcessorId: "zelle-phoenix",
      })
      .where(eq(transactions.id, newTransaction.id)),
    db
      .update(zellePaymentsMetadata)
      .set({
        confirmationStatus: "payment-confirmed-by-admin",
      })
      .where(eq(zellePaymentsMetadata.transactionId, transactionId)),
    db
      .update(payoutBalance)
      .set({
        balance: isInstant
          ? payoutBalanceOfProject.balance + 0
          : payoutBalanceOfProject.balance + (newTransaction.finalAmountInFiat ?? 0),
        paidOut: isInstant
          ? onChainTxId ? payoutBalanceOfProject.paidOut + (newTransaction.finalAmountInFiat ?? 0) : payoutBalanceOfProject.paidOut + 0
          : payoutBalanceOfProject.paidOut + 0,
      })
      .where(eq(payoutBalance.projectId, transaction.projectId)),
    ...finalBatches,

  ]);

};
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
      to: z.string().email(),
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
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);
    const now = new Date();

    const zelleTransaction = await db.query.zelleTransactions.findFirst({
      where: and(
        eq(zelleTransactions.amount, transaction.amountInFiat),
        gte(zelleTransactions.createdAt, twelveHoursAgo),
        lte(zelleTransactions.createdAt, now)
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

  if (latestTransaction.lock) {
    return c.json({ error: "Transaction is  locked" }, 400);
  }
  if(latestTransaction.status === "confirmed-onchain"){
    return c.json({ error: "Transaction is already confirmed onchain" }, 400);
  }
  if(latestTransaction.status === "fiat-confirmed"){
    await handleOnChainTransaction(
     
      validatedData.transactionId,
      latestTransaction,
      validatedData
    );
    const newTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, validatedData.transactionId),
    });
    if(newTransaction?.status === "confirmed-onchain"){
      await bus.publish(
        Resource.WebhookEventBusV1.name,
        WebhookEvents.Transaction.OnChainConfirmed,
        {
          metadata: {
            projectId: latestTransaction.projectId,
            event: "transaction.onChainConfirmed",
          },
          transaction: {
            transaction: newTransaction
          },
        }
      )
    }
  }
  await db
  .update(transactions)
  .set({
    lock: false,
  })
  .where(eq(transactions.id, validatedData.transactionId));

const updatedTransaction = await db.query.transactions.findFirst({
  where: eq(transactions.id, validatedData.transactionId),
});
return c.json({ transaction: updatedTransaction }, 200);
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
app.get("/lp/:zelleId", async (c) => {
  try {
    const zelleId = c.req.param("zelleId");
    const [lp] = await db.select().from(liquidityProviders).where(eq(liquidityProviders.zelleId, zelleId));

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
      zelleId: validatedData.payload.parsed.to,
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
    console.log("zelle-details-payment-details-update")
    const { transactionId } = await c.req.json<{ transactionId: string }>()
    if (!transactionId) {
      return c.json(
        { error: 'Transaction ID is required' },
        400
      );
    }
    
    const transaction = await db.query.transactions.findFirst({ 
      where: eq(transactions.id, transactionId),
    })
    console.log({transaction})
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
   
    
    console.log({zelleMetadata})
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
    const { data: checkoutMetadata, success } =
    payoutMetadataSchema.safeParse(transaction.metadataJson);
    if(!success){
      return c.json({
        success: false,
        error: "Invalid metadata"
      }, 400)
    }
    const payoutAddress = checkoutMetadata.payoutAddress;
  
    

    // const liquidityProvider : typeof liquidityProviders.$inferSelect = await ZelleMail.getLiquidityProvider(transaction.amountInFiat, payoutAddress);
    // const totalPercentage = liquidityProvider.feesPercentage;
    // const amountInAfterOffset = ((100 - totalPercentage)  / 100) * transaction.amountInFiat;  
    // console.log("==================amountInAfterOffset================================= ================",amountInAfterOffset)
    // console.log("==================AMOUNT IN AFTER OFFSET 2 dp ================================= ================",Number(amountInAfterOffset.toFixed(2)))
    const { amountIn: finalAmount, amountOut: finalAmountOut,randomAmount ,liquidityProvider} = await ZelleMail.quoteOrder(Number(transaction.amountInFiat),  payoutAddress);
    console.log("==================finalAmount================================= ================",finalAmount)

 

    await db.batch([
      db.update(zellePaymentsMetadata).set({
        confirmationStatus: "wait-for-payment-details",
        payoutDetails: liquidityProvider.zelleId,
        amount: finalAmount,
        uniquenessAmount: randomAmount
      }).where(eq(zellePaymentsMetadata.transactionId, transactionId)),
      db.update(transactions).set({
        amountInFiat: finalAmount,
        externalPaymentProviderId: zelleMetadata.id,
      }).where(eq(transactions.id, transactionId))
    ]);

    return c.json({
      success: true,
      data: {
        orderId: zelleMetadata.id,
        status: "pending",
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