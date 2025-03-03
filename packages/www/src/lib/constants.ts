import { env } from "../../env";

export const API_URL = typeof window === "undefined" ? env.API_URL : env.NEXT_PUBLIC_API_URL
export const STAGE = typeof window === "undefined" ? env.STAGE : env.NEXT_PUBLIC_STAGE
export const DEFAULT_BLOCKCHAIN = STAGE === "production" ? "arbitrum-one" : "sepolia-eth"

export const VALID_BLOCKCHAINS = STAGE === "production" ? [
    {
        value:"arbitrum-one",
        label:"Arbitrum",
        chainId:42161,
        isInstant:true,
        isCustom:false,
        token:"USDC"
    },
   
] : [
    {
        value:"sepolia-eth",
        label:"Sepolia",
        chainId:11155111,
        isInstant:true,
        isCustom:true,
        token:"USDC"
    },
    {
        value:"nile-tron",
        label:"Nile Tron Testnet",
        chainId:0,
        isInstant:false,
        isCustom:true,
        token: "JST"
    }
]
export const DOMAIN = STAGE === "production" ? "https://normie.tech" : typeof window === "undefined" ? "http://localhost:3000" : window.location.origin