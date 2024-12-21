export * as Wallet from "./index";
import type { MetaTransactionData} from '@safe-global/safe-core-sdk-types';
import { privateKeyToAddress,generatePrivateKey, privateKeyToAccount, Account} from 'viem/accounts'

import Safe from "@safe-global/protocol-kit";
import {arbitrum, base, optimism, celo, tron, polygon} from "viem/chains"
import { Resource } from "sst";
import { ChainId, USD_TOKEN_ADDRESSES, WalletType } from "./types";
import { AESCipher } from "@/util/encryption";
import { createPublicClient, createWalletClient, encodeFunctionData, erc20Abi, http, PublicClient, WalletClient } from "viem";
import { sleep } from "@/util/sleep";
import { Helius } from "helius-sdk";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction, PublicKey, TransactionMessage, VersionedTransaction, ParsedAccountData, ComputeBudgetProgram, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction} from "@solana/spl-token";
import bs58 from "bs58";
import {TronWeb} from 'tronweb';



export type TransactionData = MetaTransactionData;

export const minimumGaslessBalance = {
  10: 100000000000000,
  8453: 100000000000000,
  42161: 100000000000000,
  11155111:100000000000000,
  42220: 30000000000000000,
  137: 100000000000000,
  1000: 100000000000000,
  0:0
}
export type CreateTransactionData  = MetaTransactionData;
const safeWallets = {
  gasless: "0x8e0103Af21C9a474035Bf00B56195b9ef3196C99",
  reserve: "0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
  tron_gasless: "",
  tron_reserve: "",
  solana_gasless: "",
  solana_reserve: "",
} as const;





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
    case 11155111:
      return Resource.ETH_SEPOLIA_RPC_URL.value
    case 1000:
      return Resource.TRON_RPC_URL.value
    case 728126428:
      return Resource.TRON_RPC_URL.value
    case 42220:
      return Resource.CELO_RPC_URL.value
    case 137:
      return Resource.POLYGON_RPC_URL.value
    default:
      throw new Error("Invalid chain id")
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
    case 137:
      return polygon;
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
export  function sendTokenData(to: string, amount: number){
  const txData = encodeFunctionData({
    abi:erc20Abi,
    functionName:"transfer",
    args:[to,BigInt(amount)]
  })
  return txData
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
  return executeTxResponse.hash
}

export async function createTronTransaction(_to: string, _value: bigint, type: WalletType, chainId: ChainId) {

  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    // eventHeaders: { 'TRON-PRO-API-KEY': Resource.TRON_GRID_API },
    privateKey: getSigner(type)
  });
  console.log('tronweb...', tronWeb);


  const functionSelector = 'transfer(address,uint256)';
  const parameter = [
    {
      type:'address',
      value:_to
    },
    {
      type:'uint256',
      value: _value
    }
  ]
  console.log(parameter);
  const tx = await tronWeb.transactionBuilder.triggerSmartContract(USD_TOKEN_ADDRESSES["tron"], functionSelector, {}, parameter);
  console.log(tx);
  const signedTx = await tronWeb.trx.sign(tx.transaction);
  console.log(signedTx);
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  console.log(result);
  // return result
}

interface SolanaTransactionData {
  toPubkey: PublicKey;
  amount: number;
}

export async function createSolanaTransaction(transactionData: SolanaTransactionData[], type: WalletType) : Promise<string>{

  const connection = new Connection(Resource.SOLANA_RPC_URL.value, {
    commitment: "confirmed" 
  })

 
  const privateKey = new Uint8Array(bs58.decode(getSigner(type)));
  const fromKeyPair = Keypair.fromSecretKey(privateKey);
  console.log(
    `Initialized Keypair: Public Key - ${fromKeyPair.publicKey.toString()}`
  );
 
  const usdcAddress = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const decimals = 6;
  console.log(usdcAddress.toString())

  let senderAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromKeyPair,
    usdcAddress,
    fromKeyPair.publicKey
  )

  console.log(senderAccount)

  const transferInstructions = [];

  for (const data of transactionData) {
    const receiverAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeyPair,
      usdcAddress,
      data.toPubkey
    );

    console.log(receiverAccount)

    const transferInstruction = createTransferInstruction(
      senderAccount.address,
      receiverAccount.address,
      fromKeyPair.publicKey,
      receiverAccount.amount * BigInt(Math.pow(10, decimals))
    )

    transferInstructions.push(transferInstruction);
  }
  console.log(transferInstructions)


  let latestBlock = await connection.getLatestBlockhash("confirmed");

  const message = new TransactionMessage({
    payerKey: fromKeyPair.publicKey,
    recentBlockhash: latestBlock.blockhash,
    instructions: transferInstructions,
  }).compileToV0Message();
  
  const transaction = new VersionedTransaction(message);
  transaction.sign([fromKeyPair]);

  const txid = await connection.sendTransaction(transaction);
  console.log(`transaction id........ : ${txid}`)

  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: latestBlock.blockhash,
    lastValidBlockHeight: latestBlock.lastValidBlockHeight
  }, "confirmed" );
  console.log(confirmation);


  return fromKeyPair.publicKey.toBase58();
}