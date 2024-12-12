import { Resource } from "sst";
import { usdcAddress } from "../wallet";
import { ChainId } from "@/wallet/types";


export const DEFAULT_USDC_DECIMALS = 6 as const
export const DEFAULT_CHAIN_ID = parseInt(Resource.DEFAULT_CHAIN_ID.value) as ChainId
export const DEFAULT_USDC_ADDRESS = usdcAddress[DEFAULT_CHAIN_ID]
export const DEFAULT_USDC_SYMBOL = "USDC" as const
export const DEFAULT_CHAIN_NAME = Resource.DEFAULT_CHAIN_NAME.value