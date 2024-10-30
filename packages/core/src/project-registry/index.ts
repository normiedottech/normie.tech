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

// Create the registry with the const assertion
export const PROJECT_REGISTRY = {
    "voice-deck": {
        id: "voice-deck",
        name: "Voice Deck",
        url: "https://voicedeck.org",
        fiatActive: true,
        
    },
} as const;

export const parseProjectRegistryKey = (key: string): ProjectRegistryKey => {
    if (!(key in PROJECT_REGISTRY)) {
        throw new Error(`Unknown project key: ${key}`);
    }
    return key as ProjectRegistryKey;
}


