import { Resource } from "sst";
import type { CreateOrderParams, GetQuoteParams, QuoteResponse } from "./types";
import { BlockchainName } from "@/wallet/types";

export class Debridge {
    apiUrl: string;
    static ValidChains: Record<string, { chainId: number; internalChainId: number }> = {
        "arbitrum-one": { chainId: 42161, internalChainId: 42161 },
        "avalanche": { chainId: 43114, internalChainId: 43114 },
        "bnb-chain": { chainId: 56, internalChainId: 56 },
        "ethereum": { chainId: 1, internalChainId: 1 },
        "polygon": { chainId: 137, internalChainId: 137 },
        "solana": { chainId: 7565164, internalChainId: 7565164 },
        Linea: { chainId: 59144, internalChainId: 59144 },
        Base: { chainId: 8453, internalChainId: 8453 },
        Optimism: { chainId: 10, internalChainId: 10 },
        Neon: { chainId: 245022934, internalChainId: 100000001 },
        "gnosis": { chainId: 100, internalChainId: 100000002 },
        'Lightlink (suspended)': { chainId: 1890, internalChainId: 100000003 },
        Metis: { chainId: 1088, internalChainId: 100000004 },
        Bitrock: { chainId: 7171, internalChainId: 100000005 },
        Sonic: { chainId: 146, internalChainId: 100000014 },
        CrossFi: { chainId: 4158, internalChainId: 100000006 },
        'Cronos zkEVM': { chainId: 388, internalChainId: 100000010 },
        Abstract: { chainId: 2741, internalChainId: 100000017 },
        Berachain: { chainId: 80094, internalChainId: 100000020 },
        Story: { chainId: 1514, internalChainId: 100000013 },
        HyperEVM: { chainId: 999, internalChainId: 100000022 }
    };
    constructor() {
        this.apiUrl = Resource.DEBRIDGE_API.value;
    }

    async getQuote(params: GetQuoteParams): Promise<QuoteResponse> {
       
        const searchParams = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));

        const response = await fetch(`${this.apiUrl}${searchParams}`);
    
        
        return response.json() as Promise<QuoteResponse>;
    }

    async createOrder(params: CreateOrderParams): Promise<QuoteResponse> {
        const searchParams = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));

        const response = await fetch(`${this.apiUrl}${searchParams}`);

        return response.json() as Promise<QuoteResponse>;
    }
}