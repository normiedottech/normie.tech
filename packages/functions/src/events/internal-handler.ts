import { metadataSquareSchema } from "@/utils";
import {
  ProjectRegistryKey,
  PROJECT_REGISTRY,
  payoutMetadataSchema,
} from "@normietech/core/config/project-registry/index";
import {
  getProjectById,
  getPayoutSettings,
  getProjectBalanceById,
} from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import {
  transactions,
  payoutSettings,
  projects,
  payoutBalance,
  notificationTokenBalances
} from "@normietech/core/database/schema/index";
import { InternalEvents } from "@normietech/core/event";
import { HypercertWrapper } from "@normietech/core/hypercerts/index";
import { SarafuWrapper } from "@normietech/core/sarafu/index";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import { sleep } from "@normietech/core/util/sleep";
import { ViaprizeWrapper } from "@normietech/core/viaprize/index";
import {
  TransactionData,
  sendTokenData,
  createTransaction,
  getOriginData,
} from "@normietech/core/wallet/index";
import {
  ChainIdSchema,
  validChainIds,
  validBlockchains,
  blockchainNamesSchema,
  USD_TOKEN_ADDRESSES,
} from "@normietech/core/wallet/types";
import { PublicKey, Connection } from "@solana/web3.js";
import { evmClient } from "@normietech/core/blockchain-client/index";
import { eq, and } from "drizzle-orm";
import { Payment } from "square";
import { Resource } from "sst";
import { bus } from "sst/aws/bus";
import { z } from "zod";
import { Mutex } from "async-mutex";
import { Telegram } from "@normietech/core/telegram";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { erc20Abi } from "viem";
const webhookMutex = new Mutex();
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
  payment: Payment
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

  let finalFiatAmountInCents = Number.parseInt(
    payment.amountMoney?.amount?.toString() ?? "0"
  );
  let feesByPaymentProcessorInCents = Number.parseInt(payment.processingFee?.[0]?.amountMoney?.amount?.toString() ?? "30") 
  transaction.paymentProcessFeesInFiat = transaction.projectId === "test-celo-only" || transaction.projectId === "test-arb-only" ? 0 : feesByPaymentProcessorInCents / 100;

  // transaction.finalAmountInFiat = (finalFiatAmountInCents - feesByPaymentProcessorInCents) / 100;
  transaction.finalAmountInFiat = finalFiatAmountInCents / 100
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

    
      transaction.platformFeesInFiat =
        transaction.finalAmountInFiat -
        removePercentageFromNumber(
          transaction.finalAmountInFiat,
          project.feePercentage
        );
      finalPayoutAmount =
        transaction.finalAmountInFiat - transaction.platformFeesInFiat;
      finalPayoutAmount = finalPayoutAmount - transaction.paymentProcessFeesInFiat
      transaction.finalAmountInFiat = finalPayoutAmount
      transaction.amountInToken = Number.parseInt(removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      ).toString()); 

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
      finalPayoutAmount = finalPayoutAmount - transaction.paymentProcessFeesInFiat
      transaction.finalAmountInFiat = finalPayoutAmount
      transaction.amountInToken = Number.parseInt(removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      ).toString()); 

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
      finalPayoutAmount = finalPayoutAmount - transaction.paymentProcessFeesInFiat
      transaction.finalAmountInFiat = finalPayoutAmount
      transaction.amountInToken = Number.parseInt(removePercentageFromNumber(
        parseInt(
          (
            transaction.finalAmountInFiat *
            10 ** transaction.decimals
          ).toString()
        ),
        project.feePercentage
      ).toString()); 

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
          BigInt(parseInt(voiceDeckMetadata.amountApproved.toString()))
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
      finalPayoutAmount = finalPayoutAmount - transaction.paymentProcessFeesInFiat
      console.log("finalPayoutAmount", finalPayoutAmount)
      transaction.finalAmountInFiat = finalPayoutAmount
      transaction.amountInToken = Number.parseInt(removePercentageFromNumber(
        parseInt(
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
          data: sendTokenData(payoutAddress, transaction.amountInToken),
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
        paymentIntent: payment.id,
        lock:false,
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

const sendMessage = async (message:string) => {
  await Telegram.sendMessage({
    chatId: "-4521345870",
    text: message,
  })
}
export const handler = bus.subscriber(
  [InternalEvents.SquareUp.OnChainTransactionConfirm, InternalEvents.PaymentCreated.OnChain,InternalEvents.PaymentCreated.Replenish],
  async (event) => {
    console.log(
      `===================EVENT PROP ${event.type}====================`
    );
    switch (event.type) {
      case "paymentCreate.replenish":{
        const {originToken,originBalance,originDecimals,originBalanceNormalized,originChainId,originBlockchain} = await getOriginData(event.properties.type)
        
        break
      } 
      case "paymentCreated.onChain":
        if(!event.properties.metadata){
          break
        }
        console.log("entered...........")
        const balanceSettings = await db.query.notificationTokenBalances.findFirst({
          where: eq(notificationTokenBalances.tokenAddress, event.properties.metadata.tokenAddress),
        })
        console.log(balanceSettings, "balance settings")
        const nativeBalanceSettings = await db.query.notificationTokenBalances.findFirst({
          where: and(
            eq(notificationTokenBalances.tokenAddress, "NATIVE"),
            eq(notificationTokenBalances.chainId, event.properties.metadata.chainId)
          ),
        })
        console.log(nativeBalanceSettings, "native balance settings")
        console.log(!nativeBalanceSettings)

        if(!balanceSettings && !nativeBalanceSettings){
          break;
        }
        console.log("entered...........")

        switch(balanceSettings?.blockchain){
          case "solana":
            {
              const connection = new Connection(Resource.SOLANA_RPC_URL.value, {
                commitment: "confirmed" 
              })

              const reserveAddress = event.properties.metadata.walletAddress;
              const publicKey = new PublicKey(reserveAddress);

              const nativeBalance = await connection.getBalance(publicKey);

              const tokenMint = new PublicKey(event.properties.metadata.tokenAddress);
              const tokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);
              const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
              const tokenBalance = accountInfo.value.uiAmount || 0;

              if (tokenBalance < balanceSettings.minimumBalance ) {
                try {
                  await sendMessage(
                    `⚠️ Low balance in ${balanceSettings.blockchain}: 
                    Current: ${tokenBalance} LAMPORTS 
                    Minimum: ${balanceSettings.minimumBalance} LAMPORTS
                    Current Native Balance: ${nativeBalance} LAMPORTS`
                    
                  );
                } catch (error) {
                  console.log("error sending message", error);
                }
              }
            }
            break;
          
          case "celo":
          case "arbitrum-one":
          case "polygon":
          case "sepolia-eth":
          case "optimism":
          case "gnosis":
          case "evm": {
            console.log("entered...........")
            const client = evmClient(event.properties.metadata.chainId);
            const tokenAddress = event.properties.metadata.tokenAddress;
            const reserveAddress = event.properties.metadata.walletAddress;

            const nativeBalance = await client.getBalance({
              address: reserveAddress as `0x${string}`,
            });

            console.log(nativeBalance, "native balance");

            const tokenBalance = await client.readContract({
              abi: erc20Abi,
              functionName: "balanceOf",
              address: tokenAddress as `0x${string}`,
              args: [reserveAddress],
            });
            if (tokenBalance > balanceSettings.minimumBalance ) {
              try {
                await sendMessage(
                  `⚠️ Low balance in ${balanceSettings.blockchain}: 
                  Current: ${tokenBalance} WEI 
                  Minimum: ${balanceSettings.minimumBalance} WEI`
                );
              } catch (error) {
                console.log("error sending message", error);
              }
            }
          }
          break;
        }

        switch(nativeBalanceSettings?.blockchain){
          case "solana":
            {
              const connection = new Connection(Resource.SOLANA_RPC_URL.value, {
                commitment: "confirmed" 
              })

              const reserveAddress = event.properties.metadata.walletAddress;
              const publicKey = new PublicKey(reserveAddress);

              const nativeBalance = await connection.getBalance(publicKey);

              // const tokenMint = new PublicKey(event.properties.metadata.tokenAddress);
              // const tokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);
              // const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
              // const tokenBalance = accountInfo.value.uiAmount || 0;

              if (nativeBalance < nativeBalanceSettings?.minimumBalance) {
                try {
                  await sendMessage(
                    `⚠️ Low balance in ${nativeBalanceSettings.blockchain}: 
                    Current: ${nativeBalance} LAMPORTS 
                    Minimum: ${nativeBalanceSettings.minimumBalance} LAMPORTS`
                  );
                } catch (error) {
                  console.log("error sending message", error);
                }
              }
            }
            break;
          
          case "celo":
          case "arbitrum-one":
          case "polygon":
          case "sepolia-eth":
          case "optimism":
          case "gnosis":
          case "evm": {
            console.log("entered...........")
            const client = evmClient(event.properties.metadata.chainId);
            const reserveAddress = event.properties.metadata.walletAddress;

            const nativeBalance = await client.getBalance({
              address: reserveAddress as `0x${string}`,
            });
            
            console.log(nativeBalance, "native balance");
            console.log(nativeBalanceSettings?.minimumBalance, "minimum balance");
            console.log(nativeBalance < nativeBalanceSettings?.minimumBalance, "native balance");
            if (nativeBalance < nativeBalanceSettings?.minimumBalance) {

              try {
                await sendMessage(
                  `⚠️ Low balance in ${nativeBalanceSettings.blockchain}: 
                  Current: ${nativeBalance} WEI 
                  Minimum: ${nativeBalanceSettings.minimumBalance} WEI`
                );
              } catch (error) {
                console.log("error sending message", error);
              }
            }
          }
          break;
        }
    }
  }
);
