import { Hono } from 'hono';
import { PayPalWebhookSDK, PayPalWebhookSubscriptionResource, PayPalWebhookOrderResource, PayPalWebhookSaleResource } from "@normietech/core/paypal/webhook";
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { paymentUsers, payoutBalance, payoutSettings, projects, projectSettings, subscriptions, subscriptionStatusEnum, transactions } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { Resource } from 'sst';
import { getDecimalsOfToken } from '@normietech/core/blockchain-client/index';
import { blockchainNamesSchema, ChainId, ChainIdSchema, validBlockchains, validChainIds } from '@normietech/core/wallet/types';
import { USD_TOKEN_ADDRESSES } from '@normietech/core/wallet/types';
import { PAYMENT_PROCESSOR_FEES } from '@normietech/core/util/fees';
import { removePercentageFromNumber } from '@normietech/core/util/percentage';
import { getAddress, routeTransaction, sendSolanaTokenTransaction, sendTokenData } from '@normietech/core/wallet/index';
import { bus } from 'sst/aws/bus';
import { WebhookEvents } from '@normietech/core/event';


const handleSubscriptionOnChainTransaction = async(transaction: typeof transactions.$inferSelect) => {

  if(transaction.status === "confirmed-onchain") {
    console.log("Transaction already confirmed on-chain");
    return
  }

  const [payoutSetting, projectSetting, project, balance] = await db.batch([
    db.query.payoutSettings.findFirst({
      where: eq(payoutSettings.projectId, transaction.projectId ?? "")
    }),
    db.query.projectSettings.findFirst({
      where: eq(projectSettings.projectId, transaction.projectId ?? "")
    }),
    db.query.projects.findFirst({
      where: eq(projects.projectId, transaction.projectId ?? "")
    }),
    db.query.payoutBalance.findFirst({
      where: eq(payoutSettings.projectId, transaction.projectId ?? "")
    })
  ])

  if (!payoutSetting || !projectSetting || !project || !balance) {
    throw new Error("Payout settings, project settings, project or payoutBalance not found");
  }

  const isInstant = payoutSetting.payoutPeriod === "instant" || payoutSetting.settlementType === "smart-contract";

  let finalPayoutAmount = transaction.amountInFiat || 0;
  transaction.paymentProcessFeesInFiat = PAYMENT_PROCESSOR_FEES["paypal"].fixedFee;
  if (projectSetting.ignorePaymentProcessorFees) {
    finalPayoutAmount -= PAYMENT_PROCESSOR_FEES["paypal"].fixedFee;
  } else {
    finalPayoutAmount -= transaction.paymentProcessFeesInFiat;
  }

  if (project.feePercentage) {
    transaction.platformFeesInFiat = finalPayoutAmount - removePercentageFromNumber(finalPayoutAmount, project.feePercentage);
    finalPayoutAmount -= transaction.platformFeesInFiat;
  }
  transaction.finalAmountInFiat = finalPayoutAmount;

  let onChainTxId: string | undefined;

  if(isInstant && validChainIds.includes(payoutSetting.chainId as any) && validBlockchains.includes(payoutSetting.blockchain)) {

    const validBlockchainName = blockchainNamesSchema.parse(payoutSetting.blockchain);
    const validChainId = ChainIdSchema.parse(payoutSetting.chainId);
    const token = USD_TOKEN_ADDRESSES[validBlockchainName];
    transaction.amountInToken = Math.floor(finalPayoutAmount * (10 ** transaction.decimals!));

    switch (validBlockchainName) {
      case "solana":
      case "solana-devnet": {
        const finalTransaction = await sendSolanaTokenTransaction({
          amount: BigInt(transaction.amountInToken),
          from: getAddress("solana_reserve"),
          to: payoutSetting.payoutAddress!,
          token,
          blockchain: validBlockchainName
        });
        onChainTxId = await routeTransaction({
          blockchainName: validBlockchainName,
          chainId: validChainId,
          transactionData: [finalTransaction],
          type: "solana_reserve",
          settlementToken: {
            address: token,
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
      case "sepolia-eth" : {
        const finalTransaction = [{
          data: sendTokenData(payoutSetting.payoutAddress!, transaction.amountInToken),
          to: token,
          value: "0",
        }];
        onChainTxId = await routeTransaction({
          blockchainName: validBlockchainName,
          chainId: validChainId,
          transactionData: finalTransaction,
          type: "reserve",
          settlementToken: {
            address: token,
            amount: BigInt(transaction.amountInToken),
            decimals: transaction.decimals!,
          },
        });
        break;
      }
      default: {
        console.error("Invalid or Unsupported blockchain name or chain ID");
        throw new Error("Invalid or Unsupported blockchain name or chain ID");
    }
  }}
  await db.batch([
    db.update(transactions)
      .set({
        blockchainTransactionId: onChainTxId,
        status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
        paymentProcessFeesInFiat: transaction.paymentProcessFeesInFiat,
        platformFeesInFiat: transaction.platformFeesInFiat,
        finalAmountInFiat: finalPayoutAmount,
        amountInToken: transaction.amountInToken,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, transaction.id)),
      db.update(payoutBalance)
      .set({
        balance: isInstant ? balance.balance + 0 : balance.balance + finalPayoutAmount,
        paidOut: isInstant ? (onChainTxId ? balance.paidOut + finalPayoutAmount : balance.paidOut + 0) : balance.paidOut + 0,
      })
      .where(eq(payoutBalance.projectId, transaction.projectId || "")),
  ])

  await bus.publish(
    Resource.WebhookEventBusV1.name,
    WebhookEvents.Transaction.OnChainConfirmed,
    {
      metadata: {
        projectId: transaction.projectId ?? "",
        event: "transaction.onChainConfirmed",
      },
      transaction: {
        ...transaction,
        blockchainTransactionId: onChainTxId,
      },
    }
  );

}



const paypalWebhookApp = new Hono();

paypalWebhookApp.post('/', withHandler(async (c) => {
  const webhookSDK = new PayPalWebhookSDK('3SR377400E572564V');
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = await c.req.text();

  // Verify webhook signature using PayPal's official endpoint
  const isValid = await webhookSDK.verifyWebhookSignature(headers, body);
  if (!isValid) {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  // Parse and process the webhook event
  const event = webhookSDK.parseWebhookEvent(body);
  const eventType = webhookSDK.getEventType(event);
  const resource = webhookSDK.getResource(event);

  // Log the event for debugging
  console.log('PayPal Webhook Event:', {
    eventType,
    resource,
    event
  });

  // Handle different event types
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.CREATED':
      await db.update(subscriptions)
      .set({ 
        status: "approval-pending",
        updatedAt: new Date()
      })
      .where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription created`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    case 'BILLING.SUBSCRIPTION.UPDATED':
      await db.update(subscriptions).set({
        updatedAt: new Date()
      }).where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription updated`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await db.update(subscriptions).set({
        status: "cancelled",
        updatedAt: new Date(),
        cancelAtPeriodEnd: true,
      }).where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription cancelled`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await db.update(subscriptions).set({
        status: "expired",
        updatedAt: new Date(),
        cancelAtPeriodEnd: true,
      }).where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription expired`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      await db.update(subscriptions).set({
        status: "cancelled",
        updatedAt: new Date(),
        cancelAtPeriodEnd: true,
      }).where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription suspended`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const subscription = resource as PayPalWebhookSubscriptionResource;
      console.log('Subscription activated', JSON.stringify(subscription, null, 2));
      const [project,projectSetting,payoutSetting] = await db.batch([
        db.select().from(projects).where(eq(projects.id,subscription.id)),
        db.select().from(projectSettings).where(eq(projectSettings.projectId,subscription.id)),
        db.select().from(payoutSettings).where(eq(payoutSettings.projectId,subscription.id))
      ])
      const paymentUser = await db.insert(paymentUsers).values({
        email:subscription.subscriber.email_address,
        name:subscription.subscriber.name.given_name + " " + subscription.subscriber.name.surname,
        externalPaymentProviderId:subscription.subscriber.payer_id,
        paymentProcessorId:"paypal",
        projectId:project[0].id,
        paypalId:subscription.subscriber.payer_id,

      } as typeof paymentUsers.$inferInsert).returning();
      await db.update(subscriptions)
      .set({ 
        status: "active",
        paymentUserId:paymentUser[0].id,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.externalSubscriptionId, resource.id));
      return c.json({ 
        message: `Subscription activated`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    }
    
    case 'PAYMENT.SALE.COMPLETED': {
      console.log('Payment event', JSON.stringify(event, null, 2));
      console.log('Payment reversed', JSON.stringify(resource, null, 2));
      const sale = resource as PayPalWebhookSaleResource;
      const [subscription,transaction] = await db.batch([
        db.select().from(subscriptions).where(eq(subscriptions.externalSubscriptionId, resource.id)),
        db.select().from(transactions).where(eq(transactions.externalPaymentProviderId, resource.id))
      ])

      const isSubscriptionActive = subscription[0] && (subscription[0].status === 'active' || subscription[0].status === 'approval-pending')
      if(isSubscriptionActive){
        const [project,projectSetting,payoutSetting] = await db.batch([
          db.select().from(projects).where(eq(projects.id,subscription[0].projectId)),
          db.select().from(projectSettings).where(eq(projectSettings.projectId,subscription[0].projectId)),
          db.select().from(payoutSettings).where(eq(payoutSettings.projectId,subscription[0].projectId))
        ])
        
        if(project[0] && projectSetting[0] && payoutSetting[0]){
          const token = USD_TOKEN_ADDRESSES[blockchainNamesSchema.parse(payoutSetting[0].blockchain)];
          const decimals = await getDecimalsOfToken(payoutSetting[0].blockchain, token, payoutSetting[0].chainId);
          const newTransaction = await db.insert(transactions).values({
            projectId: project[0].projectId,
            amountInFiat: parseFloat(sale.amount.total),
            currencyInFiat: "USD",
            status: "pending",
            productId: subscription[0].productId,
            
            blockChainName: payoutSetting[0].blockchain,
            chainId: payoutSetting[0].chainId,
            decimals: decimals,
            externalPaymentProviderId: sale.id,
            paymentProcessorId: "paypal",
            token: token,
            metadataJson: JSON.stringify({
              ...subscription[0].metadata,
            }),
            subscriptionId: subscription[0].id,
          }).returning();

          await handleSubscriptionOnChainTransaction(newTransaction[0])

          console.log("subscription transaction went well...........")

        }}
      return c.json({ 
        message: 'Payment completed',
        saleId: resource.id,
        amount: 'amount' in resource ? resource.amount.total : undefined,
        currency: 'amount' in resource ? resource.amount.currency : undefined
      });
    }
    case 'PAYMENT.SALE.REFUNDED': {
      console.log('Payment event', JSON.stringify(event, null, 2));
      console.log('Payment reversed', JSON.stringify(resource, null, 2)); 
      return c.json({ 
        message: 'Payment refunded',
        saleId: resource.id,
        amount: 'amount' in resource ? resource.amount.total : undefined,
        currency: 'amount' in resource ? resource.amount.currency : undefined
      });
    }
    case 'PAYMENT.SALE.REVERSED': {
      console.log('Payment event', JSON.stringify(event, null, 2));
      console.log('Payment reversed', JSON.stringify(resource, null, 2));

      return c.json({ 
        message: 'Payment reversed',
        saleId: resource.id,
        amount: 'amount' in resource ? resource.amount.total : undefined,
        currency: 'amount' in resource ? resource.amount.currency : undefined
      });
    }

    // Handle order events
    case 'CHECKOUT.ORDER.APPROVED': {
      const order = resource as PayPalWebhookOrderResource;
      console.log('Order approved event:', JSON.stringify(order, null, 2));
      return c.json({
        message: 'Order approved',
        orderId: order.id,
        status: order.status,
        amount: order.purchase_units[0]?.amount.value,
        currency: order.purchase_units[0]?.amount.currency_code,
        payer: {
          email: order.payer.email_address,
          name: `${order.payer.name.given_name} ${order.payer.name.surname}`
        }
      });
    }

    case 'CHECKOUT.ORDER.COMPLETED': {
      const order = resource as PayPalWebhookOrderResource;
      console.log('Order completed event:', JSON.stringify(order, null, 2));
      return c.json({
        message: 'Order completed',
        orderId: order.id,
        status: order.status,
        amount: order.purchase_units[0]?.amount.value,
        currency: order.purchase_units[0]?.amount.currency_code,
        payer: {
          email: order.payer.email_address,
          name: `${order.payer.name.given_name} ${order.payer.name.surname}`
        }
      });
    }

    case 'CHECKOUT.PAYMENT-APPROVAL.REVERSED': {
      const order = resource as PayPalWebhookOrderResource;
      console.log('Payment approval reversed event:', JSON.stringify(order, null, 2));
      return c.json({
        message: 'Payment approval reversed',
        orderId: order.id,
        status: order.status,
        amount: order.purchase_units[0]?.amount.value,
        currency: order.purchase_units[0]?.amount.currency_code
      });
    }
    
    
    default:
      return c.json({ 
        message: 'Webhook received but no specific handler',
        eventType,
        resourceId: resource.id
      });
  }
}));

export default paypalWebhookApp; 