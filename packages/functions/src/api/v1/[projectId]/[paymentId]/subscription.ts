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
  paymentUsers,
  subscriptionStatusEnum,
  paymentProcessorEnum
} from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getPayPalAccessToken, createPayPalSubscription } from './payments/paypal-utils';

const subscriptionApp = new Hono();

// Schema for subscription creation request
const subscriptionBodySchema = z.object({
  planId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
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

  const [projectSetting, project] = await db.batch([
    db.query.projectSettings.findFirst({ where: eq(projectSettings.projectId, projectId) }),
    db.query.projects.findFirst({ where: eq(projects.projectId, projectId) })
  ]);

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  if (!project.fiatActive) {
    return c.json({ error: "Fiat payments are disabled for this project" }, 400);
  }

  if (!projectSetting?.activate_subscription) {
    return c.json({ error: "Subscription plans are not enabled for this project" }, 400);
  }

  switch(projectSetting?.firstPreferredPaymentProcessor) {
    case "paypal": {
      const accessToken = await getPayPalAccessToken();

      // Create or get payment user
      let paymentUser = await db.query.paymentUsers.findFirst({
        where: eq(paymentUsers.email, body.email)
      });

      if (!paymentUser) {
        const newPaymentUser = {
          id: nanoid(10),
          email: body.email,
          name: `${body.firstName} ${body.lastName}`,
          projectId: projectId,
          paypalId: null,
          externalId: null,
          phoneNumber: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(paymentUsers).values(newPaymentUser);
        paymentUser = newPaymentUser;
      }

      // Create subscription in PayPal
      const paypalSubscription = await createPayPalSubscription(
        accessToken,
        body.planId,
        body.email,
        body.firstName,
        body.lastName
      );

      console.log(paypalSubscription);

      // Create subscription in our database
      const subscription = {
        id: nanoid(14),
        projectId: projectId,
        planId: body.planId,
        productId: paypalSubscription.product_id,
        paymentUserId: paymentUser.id,
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
