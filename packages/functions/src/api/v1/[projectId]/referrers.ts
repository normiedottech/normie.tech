import { Hono } from 'hono';
import { z } from 'zod';
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { apiKeys, referrers } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";

const referrersApp = new Hono();

// Schema for updating referrer
const updateReferrerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

referrersApp.get('/', withHandler(async (c) => {
  const { projectId: projectIdParam } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const referrer= await db.query.referrers.findMany({
    where: eq(referrers.projectId, projectId),
  });
  return c.json(referrer, 200);
}));
referrersApp.get('/:referralId', withHandler(async (c) => {
  const { projectId: projectIdParam, referralId } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const referrer= await db.query.referrers.findFirst({
    where: eq(referrers.referralId, referralId),
  });
  return c.json(referrer, 200);
}));
// Route for updating referrer details
referrersApp.put('/:referralId', withHandler(async (c) => {
  const { projectId: projectIdParam, referralId } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  if (!projectIdParam || !referralId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const body = await c.req.json();
  const updateData = updateReferrerSchema.parse(body);

  // Check if referrer exists and belongs to the project
  const existingReferrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, referralId),
  });

  if (!existingReferrer) {
    return c.json({ error: "Referrer not found" }, 404);
  }

  if (existingReferrer.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Update referrer
  const [updatedReferrer] = await db
    .update(referrers)
    .set({
      email: updateData.email ?? existingReferrer.email,
      phone: updateData.phone ?? existingReferrer.phone,
    })
    .where(eq(referrers.referralId, referralId))
    .returning();

  return c.json(updatedReferrer, 200);
}));

export default referrersApp; 