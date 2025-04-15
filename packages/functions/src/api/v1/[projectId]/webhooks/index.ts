import { apiKeyMiddleware } from "@/middleware/apiKey";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import {
	WebhookEvents,
	WebhookEventsSchema,
	webhooks,
} from "@normietech/core/database/schema/index";
import { and, eq } from "drizzle-orm";
// src/routes/webhooks.ts
import { Hono } from "hono";
import { z } from "zod";

const createWebhookSchema = z.object({
	endpoint: z.string().url().max(255),
	events: WebhookEventsSchema,
	secret: z.string().min(1).max(128),
	description: z.string().max(255).optional(),
});

const webhookApp = new Hono()
	.post("/", apiKeyMiddleware, async (c) => {
		const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
		const body = await c.req.json();
		console.log("post webhook body.....", body);
		const parsed = createWebhookSchema.parse(body);
		const newWebhook = {
			projectId,
			endpoint: parsed.endpoint,
			events: parsed.events,
			secret: parsed.secret,
			description: parsed.description,
		};
		await db.insert(webhooks).values(newWebhook);
		return c.json(newWebhook, 201);
	})

	.get("/", async (c) => {
		const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
		const projectWebhooks = await db
			.select()
			.from(webhooks)
			.where(eq(webhooks.projectId, projectId));
		return c.json(projectWebhooks, 200);
	})

	.delete("/:webhookId", apiKeyMiddleware, async (c) => {
		const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
		const { webhookId } = c.req.param();
		await db
			.delete(webhooks)
			.where(
				and(eq(webhooks.projectId, projectId), eq(webhooks.id, webhookId)),
			);
		return c.json({ message: "Webhook deleted successfully" }, 200);
	});

export default webhookApp;
