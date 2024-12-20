import { env } from "../../env";

export const API_URL = typeof window === "undefined" ? env.API_URL : env.NEXT_PUBLIC_API_URL
export const STAGE = typeof window === "undefined" ? env.STAGE : env.NEXT_PUBLIC_STAGE
export const DEFAULT_CHAIN_ID = STAGE === "production" ? 42161 : 11155111
export const DEFAULT_CHAIN_NAME = STAGE === "production" ? "arbitrum-one" : "sepolia-ethereum"
export const DOMAIN = STAGE === "production" ? "https://normie.tech" : typeof window === "undefined" ? "http://localhost:3000" : window.location.origin