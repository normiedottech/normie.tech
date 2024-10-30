import { z } from "zod";
export const ChainIdSchema = z.union([z.literal(10), z.literal(8453),z.literal(42161)]).default(10);
export type ChainId = z.infer<typeof ChainIdSchema>;
export const WalletTypeSchema= z.union([z.literal("gasless"), z.literal("reserve")]).default("gasless");
export type WalletType = z.infer<typeof WalletTypeSchema>;
