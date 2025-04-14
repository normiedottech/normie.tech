"use server";

import { db } from "@normietech/core/database/index";
import {
	webhooks,
	webhookDeliveries,
} from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { WebhookEventType, WebhookEvents } from "../types/webhooks";

function generateWebhookSecret(): string {
	// Generate a random string using nanoid
	const randomString = nanoid(32);
	// Create a SHA-256 hash of the random string
	const hash = createHash("sha256").update(randomString).digest("hex");
	return hash;
}

export async function getWebhooks() {
	try {
		const session = await auth();
		if (!session?.user?.projectId) {
			return { success: false, error: "Unauthorized" };
		}

		const data = await db
			.select()
			.from(webhooks)
			.where(eq(webhooks.projectId, session.user.projectId));

		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch webhooks",
		};
	}
}

export async function getWebhookDeliveries(webhookId: string) {
	try {
		const session = await auth();
		if (!session?.user?.projectId) {
			return { success: false, error: "Unauthorized" };
		}

		const data = await db
			.select()
			.from(webhookDeliveries)
			.where(eq(webhookDeliveries.webhookId, webhookId));

		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch webhook deliveries",
		};
	}
}

export async function createWebhook(data: {
	endpoint: string;
	description?: string;
	events: WebhookEventType[];
}) {
	try {
		const session = await auth();
		if (!session?.user?.projectId) {
			return { success: false, error: "Unauthorized" };
		}

		const result = await db.insert(webhooks).values({
			...data,
			secret: generateWebhookSecret(),
			projectId: session.user.projectId,
		});

		return { success: true, data: [] };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create webhook",
		};
	}
}

export async function updateWebhook(data: {
	id: string;
	active?: boolean;
	generateNewSecret?: boolean;
	endpoint?: string;
	description?: string;
	events?: WebhookEventType[];
}) {
	try {
		const session = await auth();
		if (!session?.user?.projectId) {
			return { success: false, error: "Unauthorized" };
		}
		console.log("data", data);
		const updateData: any = { ...data };

		if (data.active !== undefined) {
			updateData.active = data.active;
		}

		if (data.generateNewSecret) {
			updateData.secret = generateWebhookSecret();
		}

		const result = await db
			.update(webhooks)
			.set(updateData)
			.where(eq(webhooks.id, data.id))
			.returning();
		console.log("result", result);

		return { success: true, data: result[0] };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update webhook",
		};
	}
}

export async function deleteWebhook(id: string) {
	try {
		const session = await auth();
		if (!session?.user?.projectId) {
			return { success: false, error: "Unauthorized" };
		}

		const result = await db.delete(webhooks).where(eq(webhooks.id, id));

		return { success: true, data: [] };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete webhook",
		};
	}
}
