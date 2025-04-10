import { db } from "@normietech/core/database/index";
import {
  notificationTokenBalances,
  payoutBalance,
  payoutSettings,
  payoutTransactions,
  users
} from "@normietech/core/database/schema/index";
import { InternalEvents } from "@normietech/core/event";
import {
  getOriginData,
  getAddress,
  getSignerAddress,
  routeTransaction,
  sendToken,
} from "@normietech/core/wallet/index";
import { PublicKey, Connection } from "@solana/web3.js";
import { evmClient, getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { eq, and } from "drizzle-orm";
import { Payment } from "square";
import { Resource } from "sst";
import { bus } from "sst/aws/bus";
import { z } from "zod";
import { Mutex } from "async-mutex";
import { DEFAULT_CHAT_ID, Telegram } from "@normietech/core/telegram";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { erc20Abi, formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { ChainIdSchema, USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { Resend } from "resend";
const sendMessage = async (message:string) => {
  await Telegram.sendMessage({
    chatId:DEFAULT_CHAT_ID,
    text: message,
  })
}
export const handler = bus.subscriber(
  [InternalEvents.SquareUp.OnChainTransactionConfirm, InternalEvents.PaymentCreated.OnChain,InternalEvents.PaymentCreated.Replenish,InternalEvents.Payout.Create,InternalEvents.Email.Send,InternalEvents.Telegram.Send],
  async (event) => {
    console.log(
      `===================EVENT PROP ${event.type}====================`
    );
    switch (event.type) {
      case "telegram.send":{
        await sendMessage(event.properties.message)
        break;
      }
      case "email.send":{
        const resend = new Resend(Resource.RESEND_API_KEY.value)
        await resend.emails.send({
          from: "support@normie.tech",
          to: event.properties.to,
          subject: event.properties.subject,
          html: event.properties.body
        })
        break;
      }
      case "payout.create":{
        const [payoutSetting,balance,payouts,user] = await db.batch([
          db.query.payoutSettings.findFirst({
            where: eq(payoutSettings.projectId, event.properties.projectId)
          }),
          db.query.payoutBalance.findFirst({
            where: eq(payoutBalance?.projectId, event.properties.projectId)
          }),
          db.query.payoutTransactions.findMany({
            where: eq(payoutTransactions.projectId, event.properties.projectId)
          }),
          db.query.users.findFirst({
            where: eq(users.id, event.properties.projectId)
          })
        ])
        if(!balance){
          throw new Error("Payout balance not found")
        }
        if(!payoutSetting){
          throw new Error("Payout setting not found")
        }
        if(payoutSetting.settlementType !== "payout"){
          throw new Error("Payout setting is not a payout")
        }
        if(!payoutSetting.payoutAddress){
          throw new Error("Payout address is not set")
        }
        if(!balance.balance){
          throw new Error("Payout balance is 0")
        }
        const chainId = ChainIdSchema.parse(payoutSetting.chainId)
        const decimals =await getDecimalsOfToken(payoutSetting.blockchain,USD_TOKEN_ADDRESSES[payoutSetting.blockchain],chainId)
        const balanceInDecimals = parseUnits(balance.balance.toString(), decimals)
        
        const pendingPayout = await db.insert(payoutTransactions).values({
          projectId: event.properties.projectId,
          amountInFiat: balance.balance,
          status: "pending",
          payoutPeriod:payoutSetting.payoutPeriod,
          settlementType:payoutSetting.settlementType,
          payoutSettings:payoutSetting.id,

        } as typeof payoutTransactions.$inferInsert).returning({
          id:payoutTransactions.id
        })
        const hash = await sendToken(
          payoutSetting.payoutAddress,
          balanceInDecimals,
          payoutSetting.blockchain,
          chainId,
          decimals
        ).catch(async (error)=>{
          console.log("error sending token", error)
          if(Resource.App.stage === "production"){
            await Promise.all([
              bus.publish(Resource.InternalEventBusV1.name,InternalEvents.Telegram.Send, {
                chatId:DEFAULT_CHAT_ID,
                message:`⚠️ Failed to do payout for ${event.properties.projectId}`
              }),
              bus.publish(Resource.InternalEventBusV1.name,InternalEvents.Email.Send, {
                to:user?.email ? [user.email,"support@normie.tech"] : ["support@normie.tech"],
                subject:`Expect Payout`,
                body:`Expect payout for project Id: ${event.properties.projectId}, within 3 business days`
              })
            ])
          }
          await db.update(payoutTransactions).set({
            status:"pending"
          }).where(eq(payoutTransactions.id,pendingPayout[0].id))
          throw new Error("Failed to send token")
        })

        
        if(!hash){
         
          console.log("error sending token")
          await db.update(payoutTransactions).set({
            status:"failed"
          }).where(eq(payoutTransactions.id,pendingPayout[0].id))
          throw new Error("Failed to send token")
        }
        await db.update(payoutTransactions).set({
          status:"confirmed-onchain",
          onChainTransactionId:hash
        }).where(eq(payoutTransactions.id,pendingPayout[0].id))
        break;
      }
      case "paymentCreate.replenish":{
        const {originToken,originBalance,originDecimals,originBalanceNormalized,originChainId,originBlockchain} = await getOriginData(event.properties.type)
        
        break
      } 
      case "paymentCreated.onChain":
        if(!event.properties.metadata){
          break
        }
        
        

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
                    Current: ${formatUnits(BigInt(tokenBalance),balanceSettings.decimals)} USDC
                    Minimum: ${formatUnits(BigInt(balanceSettings.minimumBalance),balanceSettings.decimals)} USDC`
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
            if (tokenBalance <= balanceSettings.minimumBalance ) {
              try {
                await sendMessage(
                  `⚠️ Low balance in ${balanceSettings.blockchain}: 
                  Current: ${formatUnits(BigInt(tokenBalance),balanceSettings.decimals)}} USDC 
                  Minimum: ${formatUnits(BigInt(balanceSettings.minimumBalance),balanceSettings.decimals)} USDC`
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
              if (nativeBalance <= nativeBalanceSettings?.minimumBalance) {
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
            if (nativeBalance <= nativeBalanceSettings?.minimumBalance) {

              try {
                await sendMessage(
                  `⚠️ Low balance in ${nativeBalanceSettings.blockchain}: 
                  Current: ${formatEther(nativeBalance)} ETH 
                  Minimum: ${formatEther(BigInt(nativeBalanceSettings.minimumBalance))} ETH`
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
