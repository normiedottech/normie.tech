import { Hono } from "hono";
import { z } from "zod";

import { db } from "@normietech/core/database/index";
import { count, eq } from "drizzle-orm";
import {
  paymentUsers,
  payoutBalance,
  projects,
  referrers,
  transactions,
  transactionSelectSchemaWithPaymentUser,
  zellePaymentsMetadata,
} from "@normietech/core/database/schema/index";
import { Resource } from "sst";
import { nanoid } from "nanoid";
import { extractFeesFromAmountInFiat } from "@normietech/core/util/fees";
import { payoutMetadataSchema } from "@normietech/core/config/project-registry/index";
import {
  getAddress,
  routeTransaction,
  sendSolanaTokenTransaction,
  sendTokenData,
  TransactionData,
} from "@normietech/core/wallet/index";
import {
  getPayoutSettings,
  getProjectById,
} from "@normietech/core/config/project-registry/utils";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import {
  blockchainNamesSchema,
  ChainIdSchema,
  USD_TOKEN_ADDRESSES,
  validBlockchains,
  validChainIds,
} from "@normietech/core/wallet/types";
import { Order, OrderFulfillment, PhoenixClient, VerifyResponse } from "@normietech/core/phoenix/index";
import { sleep } from "@normietech/core/util/sleep";

const phoenixCaptureOrderApp = new Hono();

export const phoenixCaptureTransactionBodySchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
})

export const handleOnChainTransaction = async (
  paymentProcessorTransaction: Order,
  transactionId: string,
  transaction: typeof transactions.$inferSelect,
  phoenixBody: z.infer<typeof phoenixCaptureTransactionBodySchema>
) => {
  let newTransaction = { ...transaction };
  console.log("newTransaction",newTransaction)
//   let newPaymentUser = {
//     id: nanoid(10),
//     email: deposytBody.email,
//     name: deposytBody.first_name + " " + deposytBody.last_name,
//     phoneNumber: deposytBody.phone,
//     projectId: transaction.projectId,
//   } as typeof paymentUsers.$inferInsert;
  if (!transaction.projectId) {
    throw new Error("Project id not found");
  }
  if (!paymentProcessorTransaction.orderFulfillment?.transaction.hash) {
    throw new Error("Hash transaction not found");
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.projectId, transaction.projectId),
    with: {
      payoutSettings: true,
      projectSettings: true,
      payoutBalance: true,
    },
  });
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

  newTransaction.externalPaymentProviderId =
    paymentProcessorTransaction.id;
  newTransaction.status = "fiat-confirmed";

  await db.batch([
    db
      .update(transactions)
      .set({
        ...newTransaction,
      })
      .where(eq(transactions.id, transactionId)),
  ]);
  console.log("amountInFiat",newTransaction.amountInFiat,"feePercentage",project.feePercentage,"ignorePaymentProcessorFees",projectSetting.ignorePaymentProcessorFees,"uniquenessAmount",paymentProcessorTransaction.uniquenessAmount)
  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, newTransaction.referral ?? "")
  })
  const referrerPercentageCut = referrer?.percentageCut ?? 0;

  const { finalAmount, totalFees, processorFee, additionalFee } =
    extractFeesFromAmountInFiat(
      newTransaction.amountInFiat ?? 0,
      "zelle-pheonix",
      project.feePercentage + referrerPercentageCut,
      projectSetting.ignorePaymentProcessorFees ?? false,
      0,
      0
    );
  transaction.finalAmountInFiat = finalAmount;
  transaction.paymentProcessFeesInFiat = processorFee;
  transaction.platformFeesInFiat = additionalFee;
  let referralFees = 0;
  if(referrer){
    referralFees = Number.parseFloat(((referrer.percentageCut / 100) * (transaction.amountInFiat ?? 0)).toFixed(2));
    if(referralFees > additionalFee){
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
        console.log("checkoutMetadata",checkoutMetadata)
        if (
          success &&
          checkoutMetadata.payoutAddress.toLowerCase() !==
            payoutAddress.toLowerCase()
        ) {
          payoutAddress = checkoutMetadata.payoutAddress;
        }
        console.log("payoutAddress",payoutAddress)
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
  if(referrer){
    finalBatches.push(db.update(referrers).set({
      totalVolume: referrer.totalVolume + (transaction.amountInFiat ?? 0),
      amountEarned: referrer.amountEarned + referralFees,
    }).where(eq(referrers.referralId, newTransaction.referral ?? "")));
  }



 
 

  await db.batch([
    db
      .update(transactions)
      .set({
        ...transaction,
        blockchainTransactionId: onChainTxId,
        status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
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

type PheonixCaptureTransactionBody = z.infer<
  typeof phoenixCaptureTransactionBodySchema
>;

phoenixCaptureOrderApp.post("/", async (c) => {
  const body = await c.req.json();
  const validatedBody =  phoenixCaptureTransactionBodySchema.parse(body);
  const client = new PhoenixClient()
  let transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, validatedBody.transactionId),
  });
  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }
  if (transaction.amountInFiat === null) {
    return c.json({ error: "Transaction amount is not set" }, 400);
  }
  if (transaction.lock) {
    return c.json({ error: "Transaction is locked" }, 400);
  }
  if (transaction.status === "fiat-confirmed") {
    return c.json({ error: "Transaction is already confirmed" }, 400);
  }
  if(transaction.status === "confirmed-onchain"){
    return c.json({ error: "Transaction is already confirmed onchain" }, 400);
  }

  await db
    .update(transactions)
    .set({
      lock: true,
    })
    .where(eq(transactions.id, validatedBody.transactionId));
  const orderId = transaction.externalPaymentProviderId;

  if(!orderId){
    return c.json({ error: "Transaction external payment provider id not found" }, 400);
  }
  let orderVerificationResponse:VerifyResponse | undefined;
  await db.update(zellePaymentsMetadata).set({
    confirmationStatus:"payment-confirmed-by-sender",
  }).where(eq(zellePaymentsMetadata.transactionId,transaction.id))
  let pollingCount = 0;
  await sleep(2500)
  orderVerificationResponse = await client.verifyOrder(orderId)
  if(!orderVerificationResponse?.verified){
    const interval = setInterval(async () => {
      console.log("pollingCount")
      if(pollingCount > 10){
        clearInterval(interval);
      }
      if (orderVerificationResponse?.verified) {
        clearInterval(interval);
      }
      console.log("orderVerificationResponse",orderVerificationResponse)
      orderVerificationResponse = await client.verifyOrder(orderId)
      pollingCount = pollingCount + 1;
    }, 2500);
    await sleep(2500)
  }
  
  
  if(pollingCount > 10){
    return c.json({ error: "Transaction not approved, please try again or contact support" }, 400);
  }
  console.log("orderVerificationResponse",orderVerificationResponse)
  if(!orderVerificationResponse?.verified){
    await db
    .update(transactions)
    .set({
      status: "failed",
      lock: false,
    })
    .where(eq(transactions.id, validatedBody.transactionId));
    console.log("transaction failed")
    return c.json({ error: "Transaction not approved, please try again or contact support" }, 400);
  }
  let latestOrder = await client.getOrder(orderId)
  
  if(latestOrder.orderStatus.status === "failed" || latestOrder.orderStatus.status === "expired" ){
    await db
    .update(transactions)
    .set({
      status: "failed",
      lock: false,
    })
    .where(eq(transactions.id, validatedBody.transactionId));
    return c.json({ error: "Transaction failed" }, 400);
  }
  console.log("latestOrder 1st",latestOrder)
  if(latestOrder.orderStatus.status === "verified"){
    let fulfillmentPollingCount = 0;
    console.log("latestOrder.orderFulfillment?.transaction.hash",latestOrder.orderFulfillment?.transaction.hash)
    while(!latestOrder.orderFulfillment?.transaction.hash && fulfillmentPollingCount <= 10){
      console.log("fulfillment sleep",(fulfillmentPollingCount ** 2) * 1000)
      await sleep((fulfillmentPollingCount ** 2) * 1000)
      console.log("fulfillmentPollingCount",fulfillmentPollingCount)
      latestOrder = await client.getOrder(orderId)
      console.log("latestOrderinging ","counted",fulfillmentPollingCount,{"latestOrder":latestOrder})
      fulfillmentPollingCount = fulfillmentPollingCount + 1;
    }
   
    if(fulfillmentPollingCount > 10){
      await db
      .update(transactions)
      .set({
        status: "fiat-confirmed",
        lock: false,
      })
      .where(eq(transactions.id, validatedBody.transactionId));
      console.log("transaction verified but not fulfilled, please try again or contact support")
      return c.json({ error: "Transaction verified but not fulfilled, please try again or contact support" }, 400);
    }
  }
  latestOrder = await client.getOrder(orderId)
  console.log("latestOrder 2nd",latestOrder)
  if(latestOrder.orderFulfillment?.transaction.hash){
    console.log("latestOrder.orderFulfillment?.transaction.hash",latestOrder.orderFulfillment?.transaction.hash)
    const latestTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, validatedBody.transactionId),
    })
    if(latestTransaction?.lock){
        try {
          console.log("handleOnChainTransaction")
            await handleOnChainTransaction(
                latestOrder,
                validatedBody.transactionId,
                latestTransaction,
                validatedBody
            )
        }
        catch(error){

          console.log("error",error)
          await db
          .update(transactions)
          .set({
            lock: false,
            status: "failed",
          })
          .where(eq(transactions.id, validatedBody.transactionId));
          console.error(error);
          return c.json({ error: "Transaction failed" }, 400);
        }
      }
   }
  await db
    .update(transactions)
    .set({
      lock: false,
    })
    .where(eq(transactions.id, validatedBody.transactionId));
  return c.json({ message: "Transaction captured" }, 200);
});

export default phoenixCaptureOrderApp;