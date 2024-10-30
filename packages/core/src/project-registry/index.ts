export * from "./index"
import { z } from "zod";

// Define the project schema
export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
});



// Define the registry schema
export const ProjectRegistrySchema = z.object({
    "voice-deck": ProjectSchema,
}).strict();

// Infer TypeScript types from the Zod schemas
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectRegistry = z.infer<typeof ProjectRegistrySchema>;
export type ProjectRegistryKey = keyof ProjectRegistry;

const orderVoiceDeckSchema = z.object({
    quoteType: z.number(),
    globalNonce: z.string(),
    orderNonce: z.string(),
    strategyId: z.number(),
    collectionType: z.number(),
    collection: z.string(),
    currency: z.string(),
    signer: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    price: z.string(),
    signature: z.string(),
    additionalParameters: z.string(),
    subsetNonce: z.number(),
    itemIds: z.array(z.string()),
    amounts: z.array(z.number()),
});

// Create the registry with the const assertion
export const PROJECT_REGISTRY = {
    "voice-deck": {
        id: "voice-deck",
        name: "Voice Deck",
        url: "https://voicedeck.org",
        fiatActive: true,
        stripeMetadataSchema:  z.object({
            order: orderVoiceDeckSchema,
            recipient: z.string(),
            amount: z.number(),
            amountApproved: z.number(),
        })
    },
} as const;

export const parseProjectRegistryKey = (key: string): ProjectRegistryKey => {
    if (!(key in PROJECT_REGISTRY)) {
        throw new Error(`Unknown project key: ${key}`);
    }
    return key as ProjectRegistryKey;
}


