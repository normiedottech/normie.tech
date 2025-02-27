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
  routeTransaction,
  createDeBridgeTransaction,
  getAddress,
  getSignerAddress,
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
import { DEFAULT_CHAT_ID, Telegram } from "@normietech/core/telegram";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits } from "viem";
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
const sendMessage = async (message:string) => {
  await Telegram.sendMessage({
    chatId:DEFAULT_CHAT_ID,
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
        if(Resource.App.stage !== "production"){
          break;
        }
        
        const reserveAddress = getAddress(event.properties.metadata.walletType);
        switch(balanceSettings?.blockchain){
         
          case "solana":
            {
              const connection = new Connection(Resource.SOLANA_RPC_URL.value, {
                commitment: "confirmed" 
              })

              
              const publicKey = new PublicKey(reserveAddress);

              const nativeBalance = await connection.getBalance(publicKey);

              const tokenMint = new PublicKey(event.properties.metadata.tokenAddress);
              const tokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);
              
              const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
              const tokenBalance = parseFloat(accountInfo.value.amount || '0');

              if (tokenBalance <= balanceSettings.minimumBalance ) {

                try {
                  await sendMessage(
                    `⚠️ Low balance in ${balanceSettings.blockchain}: 
                    Current: ${formatUnits(BigInt(tokenBalance),balanceSettings.decimals)} TOKENS
                    Minimum: ${formatUnits(BigInt(balanceSettings.minimumBalance),balanceSettings.decimals)} TOKENS
                    Current Native Balance: ${formatUnits(BigInt(balanceSettings.minimumBalance),9)}} SOL`
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
          case "ethereum":
          
          case "evm": {
            console.log("entered...........")
            const client = evmClient(event.properties.metadata.chainId);
            const tokenAddress = event.properties.metadata.tokenAddress;
       

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
                  Current: ${formatUnits(BigInt(tokenBalance),balanceSettings.decimals)}} TOKENS 
                  Minimum: ${formatUnits(BigInt(balanceSettings.minimumBalance),balanceSettings.decimals)} WEI`
                );
              
              } catch (error) {
                console.log("error sending message", error);
              }
            }
          }
          break;
        }
        const signerAddress = getSignerAddress(event.properties.metadata.walletType);
        switch(nativeBalanceSettings?.blockchain){
          case "solana":
            {
              const connection = new Connection(Resource.SOLANA_RPC_URL.value, {
                commitment: "confirmed" 
              })

              
              const publicKey = new PublicKey(signerAddress);

              const nativeBalance = await connection.getBalance(publicKey);
              if (nativeBalance < nativeBalanceSettings?.minimumBalance) {
                try {
                  await sendMessage(
                 `⚠️ Low balance in ${nativeBalanceSettings.blockchain}: 
                    Current: ${formatUnits(BigInt(nativeBalance),9)} SOL
                    Minimum: ${formatUnits(BigInt(nativeBalanceSettings.minimumBalance),nativeBalanceSettings.decimals)} SOL
                  `
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
          case "ethereum":
          case "gnosis":
          case "evm": {
            
            const client = evmClient(event.properties.metadata.chainId);
           

            const nativeBalance = await client.getBalance({
              address: signerAddress as `0x${string}`,
            });
            if (nativeBalance < nativeBalanceSettings?.minimumBalance) {

              try {
                await sendMessage(
                  `⚠️ Low balance in ${nativeBalanceSettings.blockchain}: 
                  Current: ${formatEther(nativeBalance)} Native Currency 
                  Minimum: ${formatEther(BigInt(nativeBalanceSettings.minimumBalance))} Native Currency`
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
