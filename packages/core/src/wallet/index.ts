export * as Wallet from "./index";
import type { MetaTransactionData} from '@safe-global/safe-core-sdk-types';
import { privateKeyToAddress,generatePrivateKey, privateKeyToAccount, Account} from 'viem/accounts'

import Safe from "@safe-global/protocol-kit";
import {arbitrum, base, optimism, celo, tron, polygon, gnosis} from "viem/chains"
import { formatEther } from 'viem'
import { Resource } from "sst";
import { BlockchainName, ChainId, USD_TOKEN_ADDRESSES, WalletType } from "./types";
import { AESCipher } from "@/util/encryption";
import { createPublicClient, createWalletClient, encodeFunctionData, erc20Abi, http, PublicClient, WalletClient } from "viem";
import { sleep } from "@/util/sleep";
import { Helius } from "helius-sdk";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction, ParsedAccountData, ComputeBudgetProgram, Connection, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction, } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction} from "@solana/spl-token";
import bs58 from "bs58";
import {Trx, Types} from 'tronweb';
import { tronClient } from "@/blockchain-client";
import {bus} from "sst/aws/bus"
import { InternalEvents } from "@/event";
import { reserveBalances } from "@/database/schema";
import { db } from "@normietech/core/database/index";
import { and, eq, sql } from "drizzle-orm";


export type TransactionData = MetaTransactionData;

export const minimumGaslessBalance = {
  10: 100000000000000,
  8453: 100000000000000,
  42161: 100000000000000,
  11155111:10000000000000,
  42220: 30000000000000000,
  137: 100000000000000,
  1000: 100000000000000,
  728126428: 100000000000000,
  100: 100000000000000,
  0:0,
}
export type CreateTransactionData  = MetaTransactionData;
const safeWallets = {
  gasless: "0x8e0103Af21C9a474035Bf00B56195b9ef3196C99",
  reserve: "0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
  tron_gasless: "TGyEqf97LAvSTdBDU1H8zaKnvYqgMArn4n",
  tron_reserve: "TGyEqf97LAvSTdBDU1H8zaKnvYqgMArn4n",
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
export function getTronRPC(blockChainName:Extract<BlockchainName,"tron"|"nile-tron">){
  switch(blockChainName){
    case "tron":
      return Resource.TRON_RPC_URL.value
    case "nile-tron":
      return Resource.TRON_NILE_RPC_URL.value
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
    case 100:
      return Resource.GNOSIS_RPC_URL.value
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
    case 100:
      return gnosis;
    case 100000002:  //this is debridge internal chain id for gnosis
      return gnosis;
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
    ],"reserve",this.chainId,"optimism")
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
      to:tokenAddress,
      account:this.account,
      chainId:this.chainId,
      chain:getChainObject(this.chainId)
    })
    return hash
  }
}
export async function sendToken(to: string,amountInToken:number, blockchainName: BlockchainName, chainId: ChainId){
  switch(blockchainName){
    case "tron":
    case "nile-tron":
      const tronWeb = tronClient(blockchainName);
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(USD_TOKEN_ADDRESSES[blockchainName],"transfer(address,uint256)",{

      },[{type:'address',value:to},{type:'uint256',value:BigInt(amountInToken)}])
      return createTronTransaction(tx.transaction,blockchainName,"tron_reserve")
    case "celo":
    case "arbitrum-one":
    case "polygon":
    case "sepolia-eth":
    case "optimism":
    case "gnosis":
    case "evm":
      const txData = sendTokenData(to,amountInToken)
      return createTransaction([
        {
          data:txData,
          to:USD_TOKEN_ADDRESSES[blockchainName],
          value:"0"
        }
      ],"reserve",chainId,blockchainName)
  }
}
export function sendTokenData(to: string, amount: number){
  const txData = encodeFunctionData({
    abi:erc20Abi,
    functionName:"transfer",
    args:[to,BigInt(amount)]
  })
  return txData
}
export async function  createTransaction(transactionDatas : MetaTransactionData[],type: WalletType,chainId: ChainId,blockchainName:BlockchainName) : Promise<string>{
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

  // //trigger events 
  if(executeTxResponse.hash){
    await bus.publish(Resource.InternalEventBus.name,InternalEvents.PaymentCreated.OnChain,{
      metadata:{
        chainId:chainId,
        walletAddress: safeAddress,
        tokenAddress:USD_TOKEN_ADDRESSES[blockchainName], 
        blockchainName:blockchainName,
        // balance: 0,
      }
    })
  }
 
  return executeTxResponse.hash
}

export async function createTronTransaction(trx: string | Types.SignedTransaction<Types.ContractParamter> | Types.Transaction<Types.ContractParamter>,blockchainName:Extract<BlockchainName,"nile-tron" | "tron">, type: Extract<WalletType,"tron_gasless"|"tron_reserve">) : Promise<string>{
  const tronWeb = tronClient(blockchainName);
  const privateKey = getSigner(type);
  tronWeb.setPrivateKey(privateKey)
  const signedTx = await tronWeb.trx.sign(trx)
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  return result.transaction.txID
}

interface SolanaTransactionData {
  toPubkey: PublicKey;
  amount: number;
}

export async function createSolanaTransaction(transactionDatas: SolanaTransactionData[], type: WalletType) : Promise<string>{

  console.log("entered........................")

  const connection = new Connection(Resource.SOLANA_DEV_NET_RPC_URL.value, {
    commitment: "confirmed" 
  })

  console.log("connection...............",connection)

  // console.log(connection.getHealth())

 
  // const privateKey = new Uint8Array(bs58.decode(getSigner(type)));
  const privateKey = new Uint8Array(bs58.decode(getSigner(type)));
  const fromKeyPair = Keypair.fromSecretKey(privateKey);
  console.log(
    `Initialized Keypair: Public Key - ${fromKeyPair.publicKey.toString()}`
  );
 
  const usdcAddress = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
  // const usdcAddress = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  const decimals = 6;
  console.log(usdcAddress.toString())

  let senderAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromKeyPair,
    usdcAddress,
    fromKeyPair.publicKey
  )

  console.log("senderAccount.......",senderAccount)

  const transferInstructions = [];

  for (const data of transactionDatas) {
    const receiverAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromKeyPair,
      usdcAddress,
      new PublicKey(data.toPubkey)
    );

    console.log("receiver account..........",receiverAccount)

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

  if(txid){
    await bus.publish(Resource.InternalEventBus.name,InternalEvents.PaymentCreated.OnChain,{
      metadata:{
        chainId:7565164,
        walletAddress: fromKeyPair.publicKey.toString(),
        tokenAddress:usdcAddress.toString(), 
        blockchainName:'solana',
        // balance: 0,
      }
    })
  }
  return fromKeyPair.publicKey.toBase58();
}


async function quote(params:Record<string, string | number | boolean>): Promise<any> {
  console.log(params);
  const searchParams = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  console.log(`${Resource.DEBRIDGE_API.value}${searchParams}`)
  const response = await fetch(`${Resource.DEBRIDGE_API.value}${searchParams}`);
  console.log(response);
  const data = await response.json();
  if (data.errorCode) throw new Error(data.errorId)
  return data
}

export async function replenishWallets(srcChainId: ChainId, dstChainId: ChainId, amount: number, srcTokenAddress: string, dstTokenAddress: string) {

  const response = await quote({
      srcChainId: srcChainId,
      srcChainTokenIn: srcTokenAddress,
      srcChainTokenInAmount: amount,   
      dstChainId: dstChainId,
      dstChainTokenOut: dstTokenAddress,
      dstChainTokenOutAmount: 'auto',
      srcChainOrderAuthorityAddress: '0x8b5E4bA136D3a483aC9988C20CBF0018cC687E6f',
      dstChainOrderAuthorityAddress: '0x8b5E4bA136D3a483aC9988C20CBF0018cC687E6f',
      dstChainTokenOutRecipient:'0x8b5E4bA136D3a483aC9988C20CBF0018cC687E6f'
  });
  console.log("transaction response here..........",response.tx);

  const approveTx = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [response.tx.to, BigInt(response.tx.value)],
  });

  console.log("approveTx here..........",approveTx);

  const tx: TransactionData[] = 
    [
      {
        to: srcTokenAddress,
        value:'0',
        data: approveTx
      },
      {
        to: response.tx.to,
        value: response.tx.value,
        data: response.tx.data,
      }
  ];

  console.log("transaction data here..........",tx);

  try {
    console.log("entering into the try block");

    const txHash = await createTransaction(tx, "reserve", srcChainId, "gnosis");
    console.log(txHash);

  } catch (error) {
    console.log("error....",error);
  }
}
