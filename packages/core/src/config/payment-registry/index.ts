import { z } from "zod";


// Define the base schema for each payment entry
const PaymentEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  isWebhookActive: z.boolean(),
  handler: z.string(),
  isCheckoutInUrl: z.boolean(),
  apiKey: z.string().optional(),
});

// Define the schema for the entire registry as an array of entries
export const PaymentRegistrySchema = z.array(PaymentEntrySchema);

// Example data
export const PAYMENT_REGISTRY =[
  {
    id: "0",
    name: "stripe",
    isWebhookActive: true,
    handler: "packages/functions/src/api/v1/[paymentId]/stripe-webhook.post",
    isCheckoutInUrl: true, 
  },
  {
    id:"1",
    name:"coinflow",
    isWebhooKActive:false,
  }
  // You can add new entries here with minimal effort
] as const;

// Example type for TypeScript usage
export type PaymentEntry = z.infer<typeof PaymentEntrySchema>;
export type PaymentRegistryId = typeof PAYMENT_REGISTRY[number]["id"];
export type PaymentRegistry = z.infer<typeof PaymentRegistrySchema>;

export const parsePaymentRegistryId = (id: string | undefined): PaymentRegistryId => {
    if (!id) {
        throw new Error("Missing payment id");
    }
    if (!PAYMENT_REGISTRY.some((entry) => entry.id === id)) {
        throw new Error(`Unknown payment id: ${id}`);
    }
    return id as PaymentRegistryId;
}
