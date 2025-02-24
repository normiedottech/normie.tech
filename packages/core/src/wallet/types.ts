import { z } from "zod";
export const ChainIdSchema = z.union([
    z.literal(10),
    z.literal(8453),
    z.literal(42161),
    z.literal(11155111),
    z.literal(1000),
    z.literal(42220),
    z.literal(137),
    z.literal(728126428),
    z.literal(100),
    z.literal(0),
    z.literal(1)
])
.default(10);
export const validChainIds = [42161, 11155111,0,100,42220,1] as const;
export type ChainId = z.infer<typeof ChainIdSchema>;
export const BLOCKCHAIN_VALUES = [
    "polygon",
    "celo",
    "arbitrum-one",
    "sepolia-eth",
    "nile-tron",
    "solana-devnet",
    "evm",
    "tron",
    "solana",
    "optimism",
    "gnosis",
    "ethereum"
] as const;
export const validBlockchains : BlockchainName[] = ["arbitrum-one","sepolia-eth","nile-tron","tron","gnosis","celo","ethereum"] as const
export const blockchainNamesSchema = z.enum(BLOCKCHAIN_VALUES)
export type BlockchainName = z.infer<typeof blockchainNamesSchema>;
export const WalletTypeSchema= z.union([z.literal("gasless"), z.literal("reserve"), z.literal("tron_gasless"), z.literal("tron_reserve"), z.literal("solana_gasless"), z.literal("solana_reserve")]).default("gasless");
export type WalletType = z.infer<typeof WalletTypeSchema>;
export const USD_TOKEN_ADDRESSES : Record<BlockchainName,string> = {
    "optimism": "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    "celo": "0x765de816845861e75a25fca122bb6898b8b1282a",
    "polygon": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    "sepolia-eth":"0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
    "tron": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    "arbitrum-one":"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "nile-tron":"TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3",
    "solana-devnet":"EmXq3Ni9gfudTiyNKzzYvpnQqnJEMRw2ttnVXoJXjLo1",
    "gnosis":"0xa555d5344f6fb6c65da19e403cb4c1ec4a1a5ee3",
    "ethereum":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    evm:"",
    solana:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}