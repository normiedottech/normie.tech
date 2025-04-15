import { createHmac } from "crypto";
// src/functions/webhookTrigger.ts
import { db } from "@normietech/core/database/index";
import {
	WebhookEventsSchema,
	webhooks,
} from "@normietech/core/database/schema/index";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Utility to send webhook with retries
async function sendWebhook(
	webhook: typeof webhooks.$inferSelect,
	payload: string,
) {}

// Lambda handler
export async function handler(event: any) {}
