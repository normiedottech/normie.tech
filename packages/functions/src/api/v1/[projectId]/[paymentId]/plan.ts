import { Hono } from 'hono';
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { z } from "zod";
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { plans, products, projectSettings } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createPayPalPlan, getPayPalAccessToken, createPayPalProduct } from './payments/paypal-utils';
import { Resource } from 'sst';

const planApp = new Hono();

// Schema for product creation
const productBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for plan creation
const planBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  interval: z.enum(['day', 'week', 'month', 'year']).default('month'),
  intervalCount: z.number().int().positive().default(1),
  metadata: z.record(z.any()).optional(),
});

// Combined schema for creating both product and plan
const createPlanBodySchema = z.object({
  product: productBodySchema.optional(),
  productId: z.string().optional(),
  plan: planBodySchema,
});

// Route for creating a plan
planApp.post('/', withHandler(async (c) => {
  console.log("Creating plan...")
  const { projectId: projectIdParam } = c.req.param<any>();
  console.log(projectIdParam, "projectIdParam")
  if (!projectIdParam ) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  const bodyRaw = await c.req.json();
  const body = createPlanBodySchema.parse(bodyRaw);

  console.log(body, "body")

  // Check if project has subscription enabled
  const settings = await db.query.projectSettings.findFirst({
    where: eq(projectSettings.projectId, projectId)
  });

  if (!settings?.activate_subscription) {
    return c.json({ error: "Subscriptions are not enabled for this project" }, 400);
  }

  let productId: string;
  let paypalProductId: string;

  // Create or use existing product
  if (body.product) {
    // Create new product in our database
    const product = {
      id: nanoid(14),
      projectId,
      name: body.product.name,
      description: body.product.description,
      images: body.product.images,
      category: body.product.category,
      metadata: body.product.metadata || {},
    };

    await db.insert(products).values(product);
    productId = product.id;

    // Create PayPal product
    const accessToken = await getPayPalAccessToken();
    const paypalProduct = await createPayPalProduct(
      accessToken,
      body.product.name,
      body.product.description
    );
    paypalProductId = paypalProduct.id;

    // Update our product with PayPal product ID
    await db.update(products)
      .set({ metadata: { ...product.metadata, paypalProductId } })
      .where(eq(products.id, productId));

  } else if (body.productId) {
    // Verify existing product
    const product = await db.query.products.findFirst({
      where: eq(products.id, body.productId)
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    if (product.projectId !== projectId) {
      return c.json({ error: "Product not found" }, 404);
    }

    productId = body.productId;
    paypalProductId = product.metadata?.paypalProductId || '';

    if (!paypalProductId) {
      // Create PayPal product if it doesn't exist
      const accessToken = await getPayPalAccessToken();
      const paypalProduct = await createPayPalProduct(
        accessToken,
        product.name,
        product.description || undefined
      );
      paypalProductId = paypalProduct.id;

      // Update our product with PayPal product ID
      await db.update(products)
        .set({ metadata: { ...product.metadata, paypalProductId } })
        .where(eq(products.id, productId));
    }
  } else {
    return c.json({ error: "Either product or productId must be provided" }, 400);
  }

  // Create PayPal plan
  const accessToken = await getPayPalAccessToken();
  const paypalPlan = await createPayPalPlan(
    accessToken,
    paypalProductId,
    body.plan.name,
    body.plan.description,
    body.plan.amount,
    body.plan.interval,
    body.plan.intervalCount
  );

  // Create plan in our database
  const plan = {
    id: nanoid(14),
    projectId,
    productId,
    name: body.plan.name,
    description: body.plan.description,
    amount: body.plan.amount,
    currency: "USD",
    interval: body.plan.interval,
    intervalCount: body.plan.intervalCount,
    status: "active" as const,
    externalPlanId: paypalPlan.id,
    metadata: {
      ...body.plan.metadata,
      paypalPlanId: paypalPlan.id
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as typeof plans.$inferInsert;

  await db.insert(plans).values(plan);

  return c.json({
    success: true,
    plan: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      status: plan.status,
      productId: productId,
      externalPlanId: paypalPlan.id,
    },
  }, 201);
}));

// Route for getting a plan
planApp.get('/:planId', withHandler(async (c) => {
  const { projectId: projectIdParam, planId } = c.req.param<any>();
  
  if (!projectIdParam || !planId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  
  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, planId),
    with: {
      product: true,
    },
  });

  if (!plan) {
    return c.json({ error: "Plan not found" }, 404);
  }

  if (plan.projectId !== projectId) {
    console.log("Project ID mismatch", { projectId, planProjectId: plan.projectId });
    return c.json({ error: "Plan not found" }, 404);
  }

  return c.json({
    success: true,
    plan: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      status: plan.status,
      product: {
        id: plan.product.id,
        name: plan.product.name,
        description: plan.product.description,
        imageUrl: plan.product.images?.[0] || null,
      },
      externalPlanId: plan.externalPlanId,
    },
  });
}));

export default planApp;
