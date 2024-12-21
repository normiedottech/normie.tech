import { blockchainTypesEnum } from "@/database/schema";
import { z } from "zod";
export const ChainIdSchema = z.union([z.literal(10), z.literal(8453),z.literal(42161),z.literal(11155111), z.literal(1000), z.literal(42220), z.literal(137)]).default(10);
export type ChainId = z.infer<typeof ChainIdSchema>;
<<<<<<< HEAD
export type BlockchainName = typeof blockchainTypesEnum.enumValues[number];
export const WalletTypeSchema= z.union([z.literal("gasless"), z.literal("reserve")]).default("gasless");
=======
export const WalletTypeSchema= z.union([z.literal("gasless"), z.literal("reserve"), z.literal("tron_gasless"), z.literal("tron_reserve"), z.literal("solana_gasless"), z.literal("solana_reserve")]).default("gasless");
>>>>>>> origin/multichain
export type WalletType = z.infer<typeof WalletTypeSchema>;
