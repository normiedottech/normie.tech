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
