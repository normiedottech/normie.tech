import { Hono } from 'hono';
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { z } from "zod";
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { 
  products, 
  projects, 
  projectSettings, 
  subscriptions as subscriptionsTable,
  plans,
  subscriptionStatusEnum,
  paymentProcessorEnum
} from "@normietech/core/database/schema/index";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPayPalAccessToken, createPayPalSubscription, cancelPayPalSubscription } from './payments/paypal-utils';
import { bus } from 'sst/aws/bus';
import { Resource } from 'sst';
import { WebhookEvents } from '@normietech/core/event';

const subscriptionApp = new Hono();

// Schema for subscription creation request
const subscriptionBodySchema = z.object({
  planId: z.string(),
});

// Route for getting all subscriptions
subscriptionApp.get('/', withHandler(async (c) => {
  const { projectId: projectIdParam } = c.req.param<any>();
  
  if (!projectIdParam) {
    return c.json({ error: "Missing project ID" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);

  const subscriptions = await db.query.subscriptions.findMany({
    where: eq(subscriptionsTable.projectId, projectId),
    with: {
      paymentUser: true,
      product: true,
    },
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
  });

  return c.json({ subscriptions }, 200);
}));

// Route for getting a single subscription
subscriptionApp.get('/:subscriptionId', withHandler(async (c) => {
  const { projectId: projectIdParam, subscriptionId } = c.req.param<any>();
  
  if (!projectIdParam || !subscriptionId) {
    return c.json({ error: "Missing required parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);

  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptionsTable.projectId, projectId),
      eq(subscriptionsTable.id, subscriptionId)
    ),
    with: {
      paymentUser: true,
      product: true,
    },
  });

  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  return c.json({ subscription }, 200);
}));

// Route for canceling a subscription
subscriptionApp.post('/:subscriptionId/cancel', withHandler(async (c) => {
  const { projectId: projectIdParam, subscriptionId } = c.req.param<any>();
  
  if (!projectIdParam || !subscriptionId) {
    return c.json({ error: "Missing required parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);

  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptionsTable.projectId, projectId),
      eq(subscriptionsTable.id, subscriptionId)
    ),
  });

  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  if (subscription.status !== "active") {
    return c.json({ error: "Subscription is not active" }, 400);
  }

  // Cancel subscription in PayPal
  if (subscription.paymentProcessorId === "paypal") {
    const accessToken = await getPayPalAccessToken();
    await cancelPayPalSubscription(accessToken, subscription.externalSubscriptionId);
  }

  // Update subscription status in database
  await db.update(subscriptionsTable)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelAtPeriodEnd: true,
    })
    .where(eq(subscriptionsTable.id, subscriptionId));

  await bus.publish(
    Resource.WebhookEventBusV1.name,
    WebhookEvents.Subscription.Cancelled,
    {
      metadata: { projectId, event: "subscription.cancelled" },
      subscription: {
        id: subscription.id,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      },
    }
  );

  return c.json({ success: true }, 200);
}));

// Route for creating a subscription
subscriptionApp.post('/', withHandler(async (c) => {
  const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();
  
  if (!projectIdParam || !paymentIdParam) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  const bodyRaw = await c.req.json();
  const body = subscriptionBodySchema.parse(bodyRaw);

  const [projectSetting, project, plan] = await db.batch([
    db.query.projectSettings.findFirst({ where: eq(projectSettings.projectId, projectId) }),
    db.query.projects.findFirst({ where: eq(projects.projectId, projectId) }),
    db.query.plans.findFirst({ 
      where: eq(plans.id, body.planId),
      with: {
        product: true
      }
    })
  ]);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  

  if (!plan) {
    return c.json({ error: "Plan not found" }, 404);
  }

  if (plan.projectId !== projectId) {
    return c.json({ error: "Plan not found" }, 404);
  }

  if (!project.fiatActive) {
    return c.json({ error: "Fiat payments are disabled for this project" }, 400);
  }

  if(!projectSetting) {
    return c.json({ error: "Project is not properly configured" }, 400);
  }

  if (!plan.externalPlanId) {
    return c.json({ error: "Plan is not properly configured with payment provider" }, 400);
  }
  if (!projectSetting?.firstPreferredPaymentProcessor) {
     projectSetting.firstPreferredPaymentProcessor = "paypal";
  }

  switch(projectSetting?.firstPreferredPaymentProcessor) {
    
    case "paypal": {
      const accessToken = await getPayPalAccessToken();

      // Create subscription in PayPal
      const subscriptionId = nanoid(14);
      const paypalSubscription = await createPayPalSubscription(
        accessToken,
        plan.externalPlanId,
        subscriptionId
      );

      // Create subscription in our database
      const subscription = {
        id: subscriptionId,
        projectId: projectId,
        planId: plan.id,
        productId: plan.productId,
        status: subscriptionStatusEnum.enumValues.find(v => v.toLowerCase() === paypalSubscription.status.toLowerCase()) || "pending",
        externalSubscriptionId: paypalSubscription.id,
        paymentProcessorId: "paypal" as const,
        currentPeriodStart: new Date(paypalSubscription.create_time),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(subscriptionsTable).values(subscription);

      await bus.publish(
        Resource.WebhookEventBusV1.name,
        WebhookEvents.Subscription.Created,
        {
            metadata: { projectId, event: "subscription.created" },
            subscription: {
                id: subscription.id,
                planId: subscription.planId,
                productId: subscription.productId,
                status: subscription.status,
                paymentProcessor: subscription.paymentProcessorId,
                paypalSubscription: paypalSubscription,
                externalSubscriptionId: subscription.externalSubscriptionId,
                createdAt: subscription.createdAt.toISOString(),
            },
        }
    );

      return c.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          externalSubscriptionId: subscription.externalSubscriptionId,
          links: paypalSubscription.links,
        },
      }, 200);
    }
    default:
      return c.json({ error: "Subscription plans are only supported with PayPal" }, 400);
  }
}));

export default subscriptionApp;
