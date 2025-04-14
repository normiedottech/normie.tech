export type WebhookEventType =
	| "transaction.pending"
	| "transaction.onChainConfirmed"
	| "transaction.fiatConfirmed";
export type WebhookEvents = WebhookEventType[];

// Server-side validation schema
import { z } from "zod";
export const WebhookEventTypeSchema = z.enum([
	"transaction.pending",
	"transaction.onChainConfirmed",
	"transaction.fiatConfirmed",
]);

export const WebhookEventsSchema = z.array(WebhookEventTypeSchema);
