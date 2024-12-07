import { usdcAddress } from "../wallet";


export const DEFAULT_USDC_DECIMALS = 6 as const
export const DEFAULT_CHAIN_ID = 42161 as const
export const DEFAULT_USDC_ADDRESS = usdcAddress[DEFAULT_CHAIN_ID]
export const DEFAULT_USDC_SYMBOL = "USDC" as const
export const DEFAULT_CHAIN_NAME = "arbitrum-one"