import { Hono } from "hono";
import { WebhooksHelper,WebhookSubscription, WebhookSubscriptionsApi,Payment,EventData} from "square";
import type { UpdatePaymentResponse,Event, OrderUpdated } from "square"
import { squareClient } from "../[projectId]/[paymentId]/payments/squreup-checkout";
import { metadataSquareSchema, metadataStripeSchema } from "@/utils";
import { paymentUsers, payoutBalance, payoutSettings, projects, transactions } from "@normietech/core/database/schema/index";
import { z } from "zod";
import { db } from "@normietech/core/database/index";
import { and, eq } from "drizzle-orm";
import { Resource } from "sst";
import { getProjectById, getPayoutSettings, getProjectBalanceById } from "@normietech/core/config/project-registry/utils";
import { bus } from "sst/aws/bus";
import { InternalEvents } from "@normietech/core/event";
import { ordersController } from "../[projectId]/[paymentId]/payments/paypal-checkout";
import { Order } from "@paypal/paypal-server-sdk";
import { payoutMetadataSchema, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { SarafuWrapper } from "@normietech/core/sarafu/index";
import { ViaprizeWrapper } from "@normietech/core/viaprize/index";
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { createTransaction, sendTokenData, TransactionData } from "@normietech/core/wallet/index";
import { blockchainNamesSchema, ChainIdSchema, USD_TOKEN_ADDRESSES, validBlockchains, validChainIds } from "@normietech/core/wallet/types";
import { formatUnits, parseUnits } from "viem";
type EventDataType = "order.updated" | "payment.updated"


const handleOnCheckoutSessionCompleted = async (
    metadata: z.infer<typeof metadataSquareSchema>
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
    if(transaction.lock){
      return
    }
    await db
      .update(transactions)
      .set({
        status: "fiat-confirmed",
        lock:true,
      })
      .where(eq(transactions.id, metadata.metadataId));
};


const handleOnChainTransaction = async (
    metadata: z.infer<typeof metadataSquareSchema>,
    payment: Order
  ) => {
    
    const payoutSetting = await db.query.payoutSettings.findFirst({
      where: and(
        eq(payoutSettings.projectId, metadata.projectId),
        eq(payoutSettings.isActive, true)
      ),
    });
    if (!payoutSetting) {
      throw new Error("Payout settings not found");
    }
  
    const isInstant =
      payoutSetting.payoutPeriod === "instant" ||
      payoutSetting.settlementType === "smart-contract";
  
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
    if(!transaction.lock){
      return
    }
    if (transaction.status === "confirmed-onchain") {
      return;
    }
    console.log(JSON.stringify(payment),"ORRRDDERRR")
    
  
    let finalFiatAmountInCents = Number.parseFloat(
    payment?.purchaseUnits?.at(0)?.payments?.captures?.at(0)?.amount?.value ?? "0"
    );
    // let feesByPaymentProcessorInCents = Number.parseInt(payment.processingFee?.[0]?.amountMoney?.amount?.toString() ?? "30") 
    let feesByPaymentProcessorInCents = payment?.purchaseUnits?.at(0)?.payments?.captures?.at(0)?.status === "PENDING" ? "30" : payment?.purchaseUnits?.at(0)?.payments?.captures?.at(0)?.sellerReceivableBreakdown?.paypalFee?.value ?? 0
    transaction.paymentProcessFeesInFiat = transaction.projectId === "test-celo-only" || transaction.projectId === "test-arb-only" ? 0 : Number.parseFloat(feesByPaymentProcessorInCents.toString());
  
    // transaction.finalAmountInFiat = (finalFiatAmountInCents - feesByPaymentProcessorInCents) / 100;
    transaction.finalAmountInFiat = finalFiatAmountInCents 
    let finalPayoutAmount = transaction.finalAmountInFiat;
    console.log("finalFiatAmountInCents", finalFiatAmountInCents)
    finalPayoutAmount = finalPayoutAmount - transaction.paymentProcessFeesInFiat
    transaction.finalAmountInFiat = finalPayoutAmount
    console.log("finalPayoutAmount After fees", finalPayoutAmount)
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
  
      
        transaction.platformFeesInFiat =
          transaction.finalAmountInFiat -
          removePercentageFromNumber(
            transaction.finalAmountInFiat,
            project.feePercentage
          );
        finalPayoutAmount =
          transaction.finalAmountInFiat - transaction.platformFeesInFiat;
        transaction.finalAmountInFiat = finalPayoutAmount
        transaction.amountInToken = Number.parseFloat(
          (transaction.finalAmountInFiat * (10 ** transaction.decimals)).toString()
        )
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
      
        transaction.platformFeesInFiat =
          transaction.finalAmountInFiat -
          removePercentageFromNumber(
            transaction.finalAmountInFiat,
            project.feePercentage
          );
        finalPayoutAmount =
          transaction.finalAmountInFiat - transaction.platformFeesInFiat;
        transaction.finalAmountInFiat = finalPayoutAmount
        transaction.amountInToken = Number.parseFloat(
            (
              transaction.finalAmountInFiat *
              10 ** transaction.decimals
            ).toString()
          )
  
        const viaprize = new ViaprizeWrapper(
          ChainIdSchema.parse(payoutSetting.chainId),
          payoutSetting.blockchain
        );
        onChainTxId = await viaprize.fundPrize(
          viaprizeMetadataParsed.userAddress as `0x${string}`,
          viaprizeMetadataParsed.contractAddress as `0x${string}`,
          BigInt(transaction.amountInToken),
          viaprizeMetadataParsed.deadline,
          viaprizeMetadataParsed.signature as `0x${string}`,
          viaprizeMetadataParsed.ethSignedMessage as `0x${string}`,
          BigInt(viaprizeMetadataParsed.amountApproved)
        );
        break;
      }
      case "voice-deck": {
        const projectId = "voice-deck";
        const projectInfo = PROJECT_REGISTRY[projectId];
      
        transaction.platformFeesInFiat =
          transaction.finalAmountInFiat -
          removePercentageFromNumber(
            transaction.finalAmountInFiat,
            project.feePercentage
          );
        finalPayoutAmount =
          transaction.finalAmountInFiat - transaction.platformFeesInFiat;
        transaction.finalAmountInFiat = finalPayoutAmount
        transaction.amountInToken = Number.parseFloat(
          (transaction.finalAmountInFiat * (10 ** transaction.decimals)).toString()
        )
          
    
 
  
        const voiceDeckMetadata = projectInfo.routes.checkout[0].bodySchema
          .pick({ metadata: true })
          .parse({
            metadata: transaction.metadataJson,
          }).metadata;
       
        const hypercert = new HypercertWrapper(
          voiceDeckMetadata.chainId,
          "reserve"
        );
        console.log("voiceDeckMetadata", voiceDeckMetadata)
        try {
          onChainTxId = await hypercert.buyHypercert(
            voiceDeckMetadata.order,
            voiceDeckMetadata.recipient,
            BigInt(voiceDeckMetadata.amount),
            BigInt(parseInt(voiceDeckMetadata.amountApproved.toString()))
          );
          
        } catch (error) {
          console.log("error", error)
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
        
        transaction.platformFeesInFiat =
          transaction.finalAmountInFiat -
          removePercentageFromNumber(
            transaction.finalAmountInFiat,
            project.feePercentage
          );
        console.log("transaction.platformFeesInFiat", transaction.platformFeesInFiat)
        finalPayoutAmount =
          transaction.finalAmountInFiat - transaction.platformFeesInFiat;
        console.log("finalPayoutAmount", finalPayoutAmount)
        transaction.finalAmountInFiat = finalPayoutAmount
        transaction.amountInToken = Number.parseFloat(removePercentageFromNumber(
          parseFloat(
            (
              transaction.finalAmountInFiat *
              10 ** transaction.decimals
            ).toString()
          ),
          project.feePercentage
        ).toString());
        
        console.log("transaction.amountInToken", transaction.amountInToken)
  
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
        console.log("finalPayoutAmount", finalPayoutAmount);
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
          finalTransactions.push({
            data: sendTokenData(payoutAddress, Math.floor(transaction.amountInToken)),
            to: USD_TOKEN_ADDRESSES[validBlockchainName],
            value: "0",
          });
  
          console.log("finalTransactions", finalTransactions);
  
          onChainTxId = await createTransaction(
            finalTransactions,
            "reserve",
            validChainId,
            payoutSetting.blockchain
          );
          break;
        }
        break;
      }
    }
  
    const balance = await getProjectBalanceById(metadata.projectId);
    console.log("balance", balance.balance,"================ balance=====")
    console.log("finalPayoutAmount", finalPayoutAmount)
    let paymentUserID = undefined;
    if(payment.payer){
        const paymentUser = await db.insert(paymentUsers).values({
            email:payment.payer.emailAddress,
            paypalId:payment.payer.payerId,
            name:`${payment.payer.name?.givenName} ${payment.payer.name?.surname}`,
            projectId:metadata.projectId,
            externalId:"paypal",
        }).returning({
            id:paymentUsers.id
        })
        paymentUserID = paymentUser[0].id
    }
    await db.batch([
      db
        .update(transactions)
        .set({
          ...transaction,
          platformFeesInFiat: parseFloat(
            transaction.platformFeesInFiat?.toFixed(4) ?? "0"
          ),
          blockchainTransactionId: onChainTxId,
          status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
          paymentIntent: payment.id,
          lock:false,
          paymentUserId:paymentUserID,
          
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

    
    return {
        success:true,
        transactionHash:onChainTxId
    }
};

const paypalCaptureOrderApp = new Hono();
paypalCaptureOrderApp.post("/", async (c) => {
    const {orderID,transactionId}:{orderID:string,transactionId:string} = await c.req.json()
    console.log({orderID,transactionId})
    const transaction = await db.query.transactions.findFirst({
        where:eq(transactions.id,transactionId)
    })
    if(!transaction){
        return c.json({error:"Transaction not found"},400)
    }
    if(transaction.status === "confirmed-onchain"){
        return c.json({error:"Transaction confirmed"},400)
    }
    // if(transaction.lock){
    //     return c.json({error:"Transaction locked"},400)
    // }
    if(!transaction.projectId){
        return c.json({error:"Project not found"},400)
    }
    await handleOnCheckoutSessionCompleted({
        paymentType:"checkout",
        projectId:transaction.projectId,
        stage:Resource.App.stage,
        metadataId:transactionId
    })
    const order = await ordersController.ordersCapture({
        id:orderID,
    })
    if(!order.result){
        return c.json({error:"Order not found"},400)
    }
    let transactionHash : string | undefined = undefined;
    if(order.result.status === "COMPLETED"){
        const res = await handleOnChainTransaction({
            paymentType:"checkout",
            projectId:transaction.projectId,
            stage:Resource.App.stage,
            metadataId:transactionId
        },order.result)
        transactionHash = res?.transactionHash
    }

    return c.json({success:true,transactionHash:transactionHash})

})
export default paypalCaptureOrderApp;