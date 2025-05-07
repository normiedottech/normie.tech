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
import { id } from 'ethers';


const handleSubscriptionOnChainTransaction = async (transaction: typeof transactions.$inferSelect,paypalFees:number) => {

  if (transaction.status === "confirmed-onchain") {
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
  transaction.paymentProcessFeesInFiat = paypalFees;
  if (projectSetting.ignorePaymentProcessorFees) {
    finalPayoutAmount = finalPayoutAmount
  } else {
    finalPayoutAmount -= transaction.paymentProcessFeesInFiat;
  }

  if (project.feePercentage) {
    transaction.platformFeesInFiat = finalPayoutAmount - removePercentageFromNumber(finalPayoutAmount, project.feePercentage);
    finalPayoutAmount -= transaction.platformFeesInFiat;
  }
  transaction.finalAmountInFiat = finalPayoutAmount;
  await bus.publish(
    Resource.WebhookEventBusV1.name,
    WebhookEvents.Transaction.FiatConfirmed,
    {
      metadata: {
        projectId: transaction.projectId ?? "", 
        event: "transaction.fiatConfirmed",
      },
      transaction: {
        ...transaction
      }
    }
  )

  let onChainTxId: string | undefined;

  if (isInstant && validChainIds.includes(payoutSetting.chainId as any) && validBlockchains.includes(payoutSetting.blockchain)) {

    const validBlockchainName = blockchainNamesSchema.parse(payoutSetting.blockchain);
    const validChainId = ChainIdSchema.parse(payoutSetting.chainId);
    const token = USD_TOKEN_ADDRESSES[validBlockchainName];
    transaction.amountInToken = Math.floor(finalPayoutAmount * (10 ** transaction.decimals));

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
      case "sepolia-eth": {
        const finalTransaction = [{
          data: sendTokenData(payoutSetting.payoutAddress!, transaction.amountInToken),
          to: token,
          value: "0",
        }];
        console.log(finalTransaction)
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
        console.log("Transaction ID:", onChainTxId);
        console.log("transaction went through....")
        break;
      }
      default: {
        console.error("Invalid or Unsupported blockchain name or chain ID");
        throw new Error("Invalid or Unsupported blockchain name or chain ID");
      }
    }
  }

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
  if(onChainTxId) {
    const updatedTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transaction.id)
    })
    await bus.publish(
      Resource.WebhookEventBusV1.name,
      WebhookEvents.Transaction.OnChainConfirmed,
      {
        metadata: {
          projectId: transaction.projectId ?? "",
          event: "transaction.onChainConfirmed",
        },
        transaction: updatedTransaction
      }
    )
  }
 

  return onChainTxId;

}



const paypalWebhookApp = new Hono();

paypalWebhookApp.post('/', withHandler(async (c) => {
  const webhookSDK = new PayPalWebhookSDK(Resource.PAYPAL_WEBHOOK_ID.value);
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = await c.req.text();

  
 

  // Verify webhook signature using PayPal's official endpoint
  const isValid = await webhookSDK.verifyWebhookSignature(headers, body);
  console.log('PayPal Webhook Signature Valid:', isValid);
  if (!isValid) {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  // Parse and process the webhook event
  const event = webhookSDK.parseWebhookEvent(body);
  const eventType = webhookSDK.getEventType(event);
  const resource = webhookSDK.getResource(event);

  console.log('PayPal Webhook Event Type:', eventType);
  console.log('PayPal Webhook Resource:', resource);
  console.log('PayPal Webhook Event:', event);



  // Handle different event types
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.CREATED': {
      await db.update(subscriptions)
        .set({
          status: "approval-pending",
          updatedAt: new Date()
        })
        .where(eq(subscriptions.externalSubscriptionId, resource.id));

      console.log('Subscription created event done');
      
      return c.json({
        message: `Subscription created`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    }

    case 'BILLING.SUBSCRIPTION.UPDATED': {
      const subscription = resource as PayPalWebhookSubscriptionResource;
      const updatedSubscription = await db.update(subscriptions).set({
        updatedAt: new Date()
      }).where(eq(subscriptions.externalSubscriptionId, resource.id)).returning();

      await bus.publish(
        Resource.WebhookEventBusV1.name,
        WebhookEvents.Subscription.Updated,
        {
          metadata: {
            projectId: resource.id,
            event: "subscription.updated"
          },
          subscription: updatedSubscription[0]
        }
      )
      return c.json({
        message: `Subscription updated`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    };

    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      const subscription = resource as PayPalWebhookSubscriptionResource;
      if (!subscription) {
        return c.json({
          message: `Subscription not found`,
          subscriptionId: resource.id,
          status: 'status' in resource ? resource.status : undefined
        });
      };
      const updatedSubscription = await db.update(subscriptions).set({
        status: "cancelled",
        updatedAt: new Date(),
        cancelAtPeriodEnd: true,
      }).where(eq(subscriptions.externalSubscriptionId, resource.id)).returning();

      await bus.publish(
        Resource.WebhookEventBusV1.name,
        WebhookEvents.Subscription.Cancelled,
        {
          metadata: {
            projectId: resource.id,
            event: "subscription.cancelled"
          },
          subscription: updatedSubscription[0]
        }
      )

      return c.json({
        message: `Subscription cancelled`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      })
    };

    case 'BILLING.SUBSCRIPTION.EXPIRED': {
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
    };

    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
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
    };

    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const subscription = resource as PayPalWebhookSubscriptionResource; 
      console.log('Subscription activated', JSON.stringify(subscription, null, 2));
      console.log("subscription id....",subscription.id)

      const subscriptionTable = await db.select().from(subscriptions).where(eq(subscriptions.externalSubscriptionId, subscription.id));
      const project = await db.select().from(projects).where(eq(projects.name, subscriptionTable[0].projectId));
      console.log(project[0], "project id is fine here...")

      const paymentUser = await db.insert(paymentUsers).values({
        email: subscription.subscriber.email_address,
        name: subscription.subscriber.name.given_name + " " + subscription.subscriber.name.surname,
        externalPaymentProviderId: subscription.subscriber.payer_id,
        paymentProcessorId: "paypal",
        projectId: project[0].id,
        paypalId: subscription.subscriber.payer_id,

      } as typeof paymentUsers.$inferInsert).returning();
      console.log(paymentUser, "payment user id is fine here...")
      await db.update(subscriptions)
        .set({
          status: "active",
          paymentUserId: paymentUser[0].id,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.externalSubscriptionId, resource.id)).returning();
      const updatedSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.externalSubscriptionId, subscription.id)
      })
      await bus.publish(
        Resource.WebhookEventBusV1.name,
        WebhookEvents.Subscription.Activated,
       {
        metadata: {
          projectId: project[0].id,
          event: "subscription.activated"
        }, 
        subscription: updatedSubscription
      })
      return c.json({
        message: `Subscription activated`,
        subscriptionId: resource.id,
        status: 'status' in resource ? resource.status : undefined
      });
    }

    case 'PAYMENT.SALE.COMPLETED': {
      console.log("entered into the payment sale completed")
      console.log('Payment event', JSON.stringify(event, null, 2));
      const sale = resource as PayPalWebhookSaleResource;

      const subscription = await db.select().from(subscriptions).where(eq(subscriptions.externalSubscriptionId, sale.billing_agreement_id));
      
      console.log(sale, "sale resource is here...")
      console.log(resource.id, "resource id is here...")
      console.log("sale id is here...", sale.id)
     
      const isSubscriptionActive = subscription[0] && (subscription[0].status === 'active' || subscription[0].status === 'approval-pending');
      console.log(isSubscriptionActive, "is subscription active or not...")
      if (isSubscriptionActive) {
        const [project, projectSetting, payoutSetting] = await db.batch([
          db.select().from(projects).where(eq(projects.name, subscription[0].projectId)),
          db.select().from(projectSettings).where(eq(projectSettings.projectId, subscription[0].projectId)),
          db.select().from(payoutSettings).where(eq(payoutSettings.projectId, subscription[0].projectId)),
        ])

        console.log(project[0], "project is here...")
        console.log(projectSetting[0], "project setting is here...")
        console.log(payoutSetting[0], "payout setting is here...")

        if (project[0] && projectSetting[0] && payoutSetting[0]) {
          const token = USD_TOKEN_ADDRESSES[blockchainNamesSchema.parse(payoutSetting[0].blockchain)];
          const decimals = await getDecimalsOfToken(payoutSetting[0].blockchain, token, payoutSetting[0].chainId);
          console.log(token, decimals, "token and decimals are here...")
          const newTransaction = await db.insert(transactions).values({
            projectId: project[0].projectId,
            amountInFiat: parseFloat(sale.amount.total),
            currencyInFiat: "USD",
            status: "fiat-confirmed",
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
          

          const transactionId = await handleSubscriptionOnChainTransaction(newTransaction[0],Number.parseFloat(sale.transaction_fee.value ?? "0"))
         
          console.log("subscription transaction went well...........", transactionId)
          return c.json({
            message: 'Payment completed',
            saleId: resource.id,
            amount: 'amount' in resource ? resource.amount.total : undefined,
            transaction: transactionId,
            currency: 'amount' in resource ? resource.amount.currency : undefined
          });
        }
      }
      
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
      console.log("entered into the the payment sale reversed...")
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