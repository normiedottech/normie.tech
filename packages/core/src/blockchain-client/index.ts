import { getRPC } from "@/wallet";
import { ChainId } from "@/wallet/types";
import { createPublicClient, http } from "viem";

export const evmClient = (chainId:ChainId) => {
    return createPublicClient({
        transport:http(getRPC(chainId))
    })
}