export * as Wallet from "./index";
import { z } from "zod";
import type { MetaTransactionData} from '@safe-global/safe-core-sdk-types';
import { privateKeyToAddress,generatePrivateKey, privateKeyToAccount} from 'viem/accounts'

import Safe from "@safe-global/protocol-kit";
import {arbitrum, base, optimism, celo} from "viem/chains"
// import { event } from 'sst/event'
// import { ZodValidator } from 'sst/event/validator'
import { Resource } from "sst";
import { ChainId, WalletType } from "./types";
// const defineEvent = event.builder({
//   validator: ZodValidator,
// })






export type CreateTransactionData  = MetaTransactionData;
const safeWallets = {
  gasless: "0x8e0103Af21C9a474035Bf00B56195b9ef3196C99",
  reserve: "0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
} as const;

const usdcAddress = {
  10:"0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  8453:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  42161:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  42220:"0x4f604735c1cf31399c6e711d5962b2b3e0225ad3"
} as const;



const gitCoinMultiReserveFunderRoundAddress = {
  10: "0x15fa08599EB017F89c1712d0Fe76138899FdB9db",
  8453: "0x042623838e4893ab739a47b46D246140477e0aF1",
  42161: "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
  42220: "0xb1481E4Bb2a018670aAbF68952F73BE45bdAD62D"
}

// export const Events = {
//   Created: defineEvent(
//     "wallet.transaction",
//     z.object({
//       address: z.string(),
//       type: z.union([z.literal("gasless"), z.literal("reserve")]),
//       hash: z.string(),
//       chainId: z.union([z.literal(10), z.literal(8453), z.literal(42161),z.literal(42220)]),
//     })
//   ),
// };



export  function getAddress(type: WalletType) {
  return safeWallets[type];
}

export function getSignerAddress(type: WalletType){
  switch(type){
    case "gasless":
      return privateKeyToAddress(Resource.GASLESS_KEY.value as `0x${string}`)
    case "reserve":
      return privateKeyToAddress(Resource.RESERVE_KEY.value as `0x${string}`)
  }
}

export function getSigner(type: WalletType){
  switch(type){
    case "gasless":
      return Resource.GASLESS_KEY.value as `0x${string}`
    case "reserve":
      return Resource.RESERVE_KEY.value as `0x${string}`
  }
}

export  function getRPC(chainId: ChainId) {


  switch(chainId){
    case 10:
      return Resource.OP_RPC_URL.value
    case 8453:
      return Resource.BASE_RPC_URL.value
    case 42161:
      return Resource.ARBITRUM_RPC_URL.value
  }
}

export function getChainObject(chain: ChainId){
  switch(chain){
    case 10:
      return optimism;
    case 8453:
      return base;
    case 42161:
      return arbitrum;
  }
}



export async function  createTransaction(transactionDatas : MetaTransactionData[],type: WalletType,chainId: ChainId) : Promise<string>{
  const signer = getSigner(type);
  if(!signer){
    throw new Error("No signer key found")
  }
  const safeAddress = getAddress(type)
  const rpcUrl = getRPC(chainId)
  console.log({rpcUrl,safeAddress,signer,transactionDatas}) 
  const protocolKit  = await Safe.default.init({
    provider:rpcUrl,
    signer: signer,
    safeAddress: safeAddress,
   })
  const safeTransactionProtocol = await protocolKit.createTransaction({ transactions: transactionDatas })
  const executeTxResponse = await protocolKit.executeTransaction(safeTransactionProtocol)
  // const output =  await Events.Created.publish({
  //   address: safeAddress,
  //   type,
  //   hash: executeTxResponse.hash,
  //   chainId
  // })
  // console.log("output",output)  
  return executeTxResponse.hash
}