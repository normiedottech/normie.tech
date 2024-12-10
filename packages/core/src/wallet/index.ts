export * as Wallet from "./index";
import { z } from "zod";
import type { MetaTransactionData} from '@safe-global/safe-core-sdk-types';
import { privateKeyToAddress,generatePrivateKey, privateKeyToAccount, Account} from 'viem/accounts'

import Safe from "@safe-global/protocol-kit";
import {arbitrum, base, optimism, celo, tron} from "viem/chains"
// import { event } from 'sst/event'
// import { ZodValidator } from 'sst/event/validator'
import { Resource } from "sst";
import { ChainId, WalletType } from "./types";
import { AESCipher } from "@/util/encryption";
import { createPublicClient, createWalletClient, encodeFunctionData, erc20Abi, http, PublicClient, WalletClient } from "viem";
import { sleep } from "@/util/sleep";
import { Helius } from "helius-sdk";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction, PublicKey} from "@solana/web3.js";
// import TronWeb from 'tronweb';

// const defineEvent = event.builder({
//   validator: ZodValidator,
// })




export const minimumGaslessBalance = {
  10: 100000000000000,
  8453: 100000000000000,
  42161: 100000000000000,
  42220: 30000000000000000,
  1000: 100000000000000
}
export type CreateTransactionData  = MetaTransactionData;
const safeWallets = {
  gasless: "0x8e0103Af21C9a474035Bf00B56195b9ef3196C99",
  reserve: "0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
} as const;

export const usdcAddress = {
  10:"0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  8453:"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  42161:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  42220:"0x4f604735c1cf31399c6e711d5962b2b3e0225ad3",
  1000: "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn"
} as const;

const gitCoinMultiReserveFunderRoundAddress = {
  10: "0x15fa08599EB017F89c1712d0Fe76138899FdB9db",
  8453: "0x042623838e4893ab739a47b46D246140477e0aF1",
  42161: "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
  42220: "0xb1481E4Bb2a018670aAbF68952F73BE45bdAD62D"
}

const heliusClinet = new Helius(Resource.HELIUS_API_KEY.value)

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
    case "tron_gasless":
      return privateKeyToAddress(Resource.TRON_GASLESS_KEY.value as `0x${string}`)
    case "tron_reserve":
      return privateKeyToAddress(Resource.TRON_RESERVE_KEY.value as `0x${string}`)
  }
}

export function getSigner(type: WalletType){
  switch(type){
    case "gasless":
      return Resource.GASLESS_KEY.value as `0x${string}`
    case "reserve":
      return Resource.RESERVE_KEY.value as `0x${string}`
    case "tron_gasless":
      return Resource.TRON_GASLESS_KEY.value as `0x${string}`
    case "tron_reserve":
      return Resource.TRON_RESERVE_KEY.value as `0x${string}`
    case "solana_gasless":
      return Resource.SOLANA_GASLESS_KEY.value as `${string}`
    case "solana_reserve":
      return Resource.SOLANA_RESERVE_KEY.value as `${string}`
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
    case 1000:
      return Resource.TRON_RPC_URL.value
    case 900:
      return Resource.SOLANA_RPC_URL.value
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
    case 1000:
      return tron;
  }
}

export class CustodialWallet {
  account: Account;
  wallet: WalletClient;
  chainId: ChainId;

  constructor(
    key: string,
    chainId:ChainId
    
  ) {
    const cipher = new AESCipher(Resource.ENCRYPTION_KEY.value);
    this.chainId = chainId;
    this.account = privateKeyToAccount(cipher.decrypt(key) as `0x${string}`);
    this.wallet = createWalletClient({
      transport:http(getRPC(chainId)),
      account: this.account,
      chain: getChainObject(chainId)
    })
  }

  get address() {
    return this.account.address;
  }
  async topUpIfMinimum(){
    const balance = await this.balance();
    if(balance < minimumGaslessBalance[this.chainId]){
      const hash = await this.topUpWithGas();
      await sleep(3000);
    }
    
  }
  async topUpWithGas(){
    const hash = await createTransaction([
    {
      data:"0x",
      to: this.address,
      value:minimumGaslessBalance[this.chainId].toString(),
    }
    ],"gasless",this.chainId)
    return hash
  }

  async balance(){
    const publicClient = createPublicClient({
      transport: http(getRPC(this.chainId)),
      chain: getChainObject(this.chainId),
    })
    const balance = await publicClient.getBalance({
      address:this.address,
    })
    return balance
  }
  async tokenBalance(tokenAddress:string){
    const publicClient = createPublicClient({
      transport: http(getRPC(this.chainId)),
      chain: getChainObject(this.chainId),
    })
    const balance = await publicClient.readContract({
      abi:erc20Abi,
      address:tokenAddress,
      functionName:"balanceOf",
      args:[this.address]
    })
    return balance
  }
  async transferToken(to: string, amount: string,tokenAddress:string){
    await this.topUpIfMinimum();
    const txData = encodeFunctionData({
      abi:erc20Abi,
      functionName:"transfer",
      args:[to,BigInt(amount)]
    })
    const hash = await this.wallet.sendTransaction({
      data:txData,
      value:BigInt(0),
      to:tokenAddress,
      account:this.account,
      chainId:this.chainId,
      chain:getChainObject(this.chainId)
    })
    return hash
  }
}

export async function sendToken(to: string, amount: number,tokenAddress:string,chainId:ChainId){
  // const publicClient = createPublicClient({
  //   transport: http(getRPC(chainId)),
  // })
  const txData = encodeFunctionData({
    abi:erc20Abi,
    functionName:"transfer",
    args:[to,BigInt(amount)]
  })

  const hash = await createTransaction([
    {
      data:txData,
      to: tokenAddress,
      value:"0",
    }
  ],"reserve",chainId)
  return hash
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

export async function createTronTransaction( _to: string, _amount: bigint, type: WalletType, chainId: ChainId) : Promise<string>{
  const signer = getSigner(type);
  if(!signer){
    throw new Error("No signer key found")
  }
  const account = await privateKeyToAccount(signer)
  const walletClient = await createWalletClient({
      transport:http(getRPC(chainId)),
      account: account,
      chain: getChainObject(chainId)
  })
  const tx = walletClient.sendTransaction({
    account,
    to:_to,
    value: _amount
  })
  console.log(tx)
  // const tronWeb = new TronWeb({
  //   fullHost: getRPC(chainId),
  //   privateKey: signer,
  // });
  return signer;
}

export async function createSolanaTransaction(toPubkey: PublicKey, amount: number, type: WalletType, chainId: ChainId) : Promise<string>{

  const fromKeyPair = Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(getSigner(type), 'hex'))
  )
  console.log(fromKeyPair)
  const fromPublicKey = fromKeyPair.publicKey;
  const instructions: TransactionInstruction[] = [
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ];
  console.log(instructions)
  const tx = await heliusClinet.rpc.sendSmartTransaction(instructions, [fromKeyPair]);
  console.log(tx)

  return fromKeyPair.publicKey.toBase58();
}