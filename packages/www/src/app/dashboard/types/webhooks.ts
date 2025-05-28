export type WebhookEventType = 
  'transaction.pending' | 
  'transaction.onChainConfirmed' | 
  'transaction.fiatConfirmed' | 
  'subscription.created' |
  'subscription.activated' |
  'subscription.updated' |
  'subscription.cancelled';
export type WebhookEvents = WebhookEventType[];

// Server-side validation schema
import { z } from "zod";
export const WebhookEventTypeSchema = z.enum([
  'transaction.pending',
  'transaction.onChainConfirmed',
  'transaction.fiatConfirmed',
  'subscription.created',
  'subscription.activated',
  'subscription.updated',
  'subscription.cancelled',
]);

export const WebhookEventsSchema = z.array(WebhookEventTypeSchema); 