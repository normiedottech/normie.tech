import { getAddress, getRPC } from "@/wallet";
import { BlockchainName, ChainId } from "@/wallet/types";
import { Resource } from "sst";
import { TronWeb } from "tronweb";
import { createPublicClient, erc20Abi, http } from "viem";
export const blockchainClient = (
  blockchain: BlockchainName,
  chainId: ChainId = 0
) => {
  switch (blockchain) {
    case "arbitrum-one":
      return evmClient(42161);
    case "sepolia-eth":
      return evmClient(11155111);
    case "celo":
      return evmClient(42220);
    case "polygon":
      return evmClient(137);
    case "optimism":
    
      return evmClient(10);
    case "gnosis":
      return evmClient(100);
    case "solana":
      throw new Error("Solana not supported");
    case "tron":
      return new TronWeb({
        fullHost: Resource.TRON_RPC_URL.value,
      });
    case "nile-tron":
      return new TronWeb({
        fullHost: Resource.TRON_NILE_RPC_URL.value,
      });
    case "evm":
      if (chainId === 0) {
        throw new Error("Chain id 0 is not valid for evm");
      }
      return evmClient(chainId);
  }
};
export const getDecimalsOfToken = async (
  blockchainName: BlockchainName,
  tokenAddress: string,
  chainId: ChainId = 0
) => {
  switch (blockchainName) {
    case "arbitrum-one":
    case "celo":
    case "polygon":
    case "optimism":
    case "sepolia-eth":
    case "gnosis":
    case "evm": {
      if (chainId === 0) {
        throw new Error("Chain id 0 is not valid for evm");
      }
      console.log("tokenAddress",tokenAddress,chainId,blockchainName)
      const client = evmClient(chainId);
      return await client.readContract({
        abi: erc20Abi,
        functionName: "decimals",
        address: tokenAddress as `0x${string}`,
      });
    }
    case "tron":
    case "nile-tron": {
      const client = tronClient(blockchainName);
      console.log("client",!!client)
      console.log("tokenAddress",tokenAddress)
      const contract = await client.contract(erc20Abi, tokenAddress);
      const decimals = await contract.decimals().call();
      return parseInt(decimals.toString());
    }
    default:
        throw new Error("Blockchain not supported");
  }
};

export const tronClient = (blockchain: BlockchainName) => {
  switch (blockchain) {
    case "tron":
      const tronMainWeb = new TronWeb({
        fullHost: Resource.TRON_RPC_URL.value,

        
      });
      tronMainWeb.setAddress(getAddress("tron_reserve"))
      return tronMainWeb
    case "nile-tron":
        console.log("nile tron")
        const tronWeb = new TronWeb({
            fullHost: Resource.TRON_NILE_RPC_URL.value,
       
        });
        tronWeb.setAddress(getAddress("tron_reserve"))
        return tronWeb
      
    default:
      throw new Error("Invalid blockchain name for tron ");
  }
};
export const evmClient = (chainId: ChainId) => {
  return createPublicClient({
    transport: http(getRPC(chainId)),
  });
};
