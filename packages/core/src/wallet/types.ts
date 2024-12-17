import { z } from "zod";
export const ChainIdSchema = z.union([z.literal(10), z.literal(8453),z.literal(42161),z.literal(11155111),z.literal(42220)]).default(10);
export type ChainId = z.infer<typeof ChainIdSchema>;
export const WalletTypeSchema= z.union([z.literal("gasless"), z.literal("reserve")]).default("gasless");
export type WalletType = z.infer<typeof WalletTypeSchema>;
