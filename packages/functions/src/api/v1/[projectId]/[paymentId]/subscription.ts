import { Hono } from 'hono';
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { z } from "zod";
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { 
  products, 
  projects, 
  projectSettings, 
  subscriptions,
  plans,
  subscriptionStatusEnum,
  paymentProcessorEnum
} from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPayPalAccessToken, createPayPalSubscription } from './payments/paypal-utils';
import { bus } from 'sst/aws/bus';
import { Resource } from 'sst';
import { WebhookEvents } from '@normietech/core/event';

const subscriptionApp = new Hono();

// Schema for subscription creation request
const subscriptionBodySchema = z.object({
  planId: z.string(),
});

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

  // if (!projectSetting?.activate_subscription) {
  //   return c.json({ error: "Subscription plans are not enabled for this project" }, 400);
  // }
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

      await db.insert(subscriptions).values(subscription);

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
