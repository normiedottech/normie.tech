export * as Wallet from "./index";
import type { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import {
  privateKeyToAddress,
  privateKeyToAccount,
  Account,
} from "viem/accounts";
import Safe from "@safe-global/protocol-kit";
import {
  arbitrum,
  base,
  optimism,
  celo,
  tron,
  polygon,
  gnosis,
  mainnet,
} from "viem/chains";
import { Resource } from "sst";
import {
  BlockchainName,
  ChainId,
  USD_REFILEMENT_AMOUNT,
  USD_TOKEN_ADDRESSES,
  WalletType,
} from "./types";
import { AESCipher } from "@/util/encryption";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  PublicClient,
  WalletClient,
} from "viem";
import { sleep } from "@/util/sleep";
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Connection,

  Transaction as SolanaTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import { Types } from "tronweb";
import { tronClient } from "@/blockchain-client";
import { bus } from "sst/aws/bus";
import { InternalEvents } from "@/event";
import { blockchainClient } from "@/blockchain-client";
import { DEFAULT_CHAT_ID, Telegram } from "@/telegram";
import { Debridge } from "@/debrige";
import { or } from "drizzle-orm";
import { CreateOrderParams } from "@/debrige/types";

export type TransactionData = MetaTransactionData;
export type TronTransactionData = string
| Types.SignedTransaction<Types.ContractParamter>
| Types.Transaction<Types.ContractParamter>
export const minimumGaslessBalance: Record<ChainId, number> = {
  10: 100000000000000,
  8453: 100000000000000,
  42161: 100000000000000,
  11155111: 10000000000000,
  42220: 30000000000000000,
  137: 100000000000000,
  1000: 100000000000000,
  728126428: 100000000000000,
  100: 100000000000000,
  0: 0,
  7565164: 0,
  1: 100000000000000,
  100000002: 100000000000000,
};
export type CreateTransactionData = MetaTransactionData;
const safeWallets = {
  gasless: "0x8e0103Af21C9a474035Bf00B56195b9ef3196C99",
  reserve: "0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
  tron_gasless: "TGyEqf97LAvSTdBDU1H8zaKnvYqgMArn4n",
  tron_reserve: "TGyEqf97LAvSTdBDU1H8zaKnvYqgMArn4n",
  solana_gasless: "GimnqBubADRU26ZhbArfVNBBGDfJSBLQSav7WgR1MDqB",
  solana_reserve: "GimnqBubADRU26ZhbArfVNBBGDfJSBLQSav7WgR1MDqB",
} as const;

export function getAddress(type: WalletType) {
  return safeWallets[type];
}

export function getSignerAddress(type: WalletType) {
  switch (type) {
    case "gasless":
      return privateKeyToAddress(Resource.GASLESS_KEY.value as `0x${string}`);
    case "reserve":
      return privateKeyToAddress(Resource.RESERVE_KEY.value as `0x${string}`);
    case "tron_gasless":
      return privateKeyToAddress(
        Resource.TRON_GASLESS_KEY.value as `0x${string}`
      );
    case "tron_reserve":
      return privateKeyToAddress(
        Resource.TRON_RESERVE_KEY.value as `0x${string}`
      );
    case "solana_gasless":
      return Keypair.fromSecretKey(new Uint8Array(bs58.decode(Resource.SOLANA_GASLESS_KEY.value as `${string}`))).publicKey.toBase58()
    case "solana_reserve":
      return Keypair.fromSecretKey(new Uint8Array(bs58.decode(Resource.SOLANA_RESERVE_KEY.value as `${string}`))).publicKey.toBase58()
  }
}

export function getSigner(type: WalletType) {
  switch (type) {
    case "gasless":
      return Resource.GASLESS_KEY.value as `0x${string}`;
    case "reserve":
      return Resource.RESERVE_KEY.value as `0x${string}`;
    case "tron_gasless":
      return Resource.TRON_GASLESS_KEY.value as `0x${string}`;
    case "tron_reserve":
      return Resource.TRON_RESERVE_KEY.value as `0x${string}`;
    case "solana_gasless":
      return Resource.SOLANA_GASLESS_KEY.value as `${string}`;
    case "solana_reserve":
      return Resource.SOLANA_RESERVE_KEY.value as `${string}`;
  }
}
export function getTronRPC(
  blockChainName: Extract<BlockchainName, "tron" | "nile-tron">
) {
  switch (blockChainName) {
    case "tron":
      return Resource.TRON_RPC_URL.value;
    case "nile-tron":
      return Resource.TRON_NILE_RPC_URL.value;
  }
}

export function getRPC(chainId: ChainId) {
  switch (chainId) {
    case 10:
      return Resource.OP_RPC_URL.value;
    case 8453:
      return Resource.BASE_RPC_URL.value;
    case 42161:
      return Resource.ARBITRUM_RPC_URL.value;
    case 11155111:
      return Resource.ETH_SEPOLIA_RPC_URL.value;
    case 1000:
      return Resource.TRON_RPC_URL.value;
    case 728126428:
      return Resource.TRON_RPC_URL.value;
    case 42220:
      return Resource.CELO_RPC_URL.value;
    case 100:
      return Resource.GNOSIS_RPC_URL.value;
    case 137:
      return Resource.POLYGON_RPC_URL.value;
    case 1:
      return Resource.ETH_MAINNET_RPC_URL.value;
    default:
      throw new Error("Invalid chain id");
  }
}
export function getSolanaRPC(blockchainName: Extract<BlockchainName,"solana" | "solana-devnet">) {
  switch(blockchainName){
    case "solana":
      return Resource.SOLANA_RPC_URL.value;
    case "solana-devnet":
      return Resource.SOLANA_DEV_NET_RPC_URL.value;
  }
}

export function getChainObject(chain: ChainId) {
  switch (chain) {
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
    case 1:
      return mainnet;
  }
}

export class CustodialWallet {
  account: Account;
  wallet: WalletClient;
  chainId: ChainId;

  constructor(key: string, chainId: ChainId) {
    const cipher = new AESCipher(Resource.ENCRYPTION_KEY.value);
    this.chainId = chainId;
    this.account = privateKeyToAccount(cipher.decrypt(key) as `0x${string}`);
    this.wallet = createWalletClient({
      transport: http(getRPC(chainId)),
      account: this.account,
      chain: getChainObject(chainId),
    });
  }

  get address() {
    return this.account.address;
  }
  async topUpIfMinimum() {
    const balance = await this.balance();
    if (balance < minimumGaslessBalance[this.chainId]) {
      const hash = await this.topUpWithGas();
      await sleep(3000);
    }
  }
  async topUpWithGas() {
    const hash = await createTransaction(
      [
        {
          data: "0x",
          to: this.address,
          value: minimumGaslessBalance[this.chainId].toString(),
        },
      ],
      "reserve",
      this.chainId,
      "optimism"
    );
    return hash;
  }

  async balance() {
    const publicClient = createPublicClient({
      transport: http(getRPC(this.chainId)),
      chain: getChainObject(this.chainId),
    });
    const balance = await publicClient.getBalance({
      address: this.address,
    });
    return balance;
  }
  async tokenBalance(tokenAddress: string) {
    const publicClient = createPublicClient({
      transport: http(getRPC(this.chainId)),
      chain: getChainObject(this.chainId),
    });
    const balance = await publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [this.address],
    });
    return balance;
  }
  async transferToken(to: string, amount: string, tokenAddress: string) {
    await this.topUpIfMinimum();
    const txData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, BigInt(amount)],
    });
    const hash = await this.wallet.sendTransaction({
      data: txData,
      to: tokenAddress,
      account: this.account,
      chainId: this.chainId,
      chain: getChainObject(this.chainId),
    });
    return hash;
  }
}
export async function sendToken(
  to: string,
  amountInToken: number,
  blockchainName: BlockchainName,
  chainId: ChainId
) {
  switch (blockchainName) {
    case "tron":
    case "nile-tron":
      const tronWeb = tronClient(blockchainName);
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        USD_TOKEN_ADDRESSES[blockchainName],
        "transfer(address,uint256)",
        {},
        [
          { type: "address", value: to },
          { type: "uint256", value: BigInt(amountInToken) },
        ]
      );
      return createTronTransaction(
        tx.transaction,
        blockchainName,
        "tron_reserve"
      );
    case "celo":
    case "arbitrum-one":
    case "polygon":
    case "sepolia-eth":
    case "optimism":
    case "gnosis":
    case "ethereum":
    case "evm":
      const txData = sendTokenData(to, amountInToken);
      return createTransaction(
        [
          {
            data: txData,
            to: USD_TOKEN_ADDRESSES[blockchainName],
            value: "0",
          },
        ],
        "reserve",
        chainId,
        blockchainName
      );
    case "solana":
    case "solana-devnet":
      const connection = blockchainClient(blockchainName) as Connection
      const tokenPubKey = new PublicKey(USD_TOKEN_ADDRESSES[blockchainName])
      const keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(getSigner("solana_reserve"))))
      const sourceAccont = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        tokenPubKey,
        keypair.publicKey
      )
      let destinationAccount = await getOrCreateAssociatedTokenAccount(
        connection, 
        keypair,
        tokenPubKey,
        new PublicKey(to)
      );
      const {decimals} = await getMint(connection,tokenPubKey)
      const finalTx = new Transaction()
      finalTx.add(createTransferInstruction(
        sourceAccont.address,
        destinationAccount.address,
        keypair.publicKey,
        amountInToken
      ))
      return routeTransaction({
        type:"solana_reserve",
        blockchainName,
        chainId:0,
        transactionData:[finalTx] as Transaction[],
        settlementToken:{
          address:tokenPubKey.toBase58(),
          decimals:decimals,
          amount:BigInt(amountInToken)
        }
      })
  }
}
export function sendTokenData(to: string, amount: number) {
  const txData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, BigInt(amount)],
  });
  return txData;
}
export async function getOriginData(type: WalletType) {
  const originClient = (await blockchainClient(
    "arbitrum-one",
    42161
  )) as PublicClient;
  const originBlockchain = "arbitrum-one" as BlockchainName;
  const originChainId = 42161 as ChainId;
  const originToken = USD_TOKEN_ADDRESSES[originBlockchain];
  const originBalance = await originClient.readContract({
    abi: erc20Abi,
    address: originToken,
    functionName: "balanceOf",
    args: [getAddress(type)],
  });
  const originDecimals = await originClient.readContract({
    abi: erc20Abi,
    address: originToken,
    functionName: "decimals",
  });
  const originBalanceNormalized = formatUnits(originBalance, originDecimals);

  return {
    originToken,
    originBalance,
    originDecimals,
    originBalanceNormalized,
    originChainId,
    originBlockchain,
    originClient,
  };
}
export interface DestinationData {
  balanceOfDestinationToken:bigint,
  destinationBlockchain:BlockchainName,
  settlementToken:{
    address: string; decimals: number; amount: bigint
  }
}
export interface OriginData {
  originBlockchain:BlockchainName,
  originBalance:bigint,
  originDecimals:number,
  originChainId:ChainId,
  originToken:string,
  originClient:PublicClient

}
export async function createDeBridgeTransaction(orderParams:Omit<CreateOrderParams,"srcChainId"|"dstChainId"|"srcChainTokenInAmount">,destination:DestinationData,originData:OriginData) {
  const originWalletClient = createWalletClient({
    transport:http(getRPC(originData.originChainId)),
    account:privateKeyToAccount(getSigner("reserve") as `0x${string}`),
    chain:getChainObject(originData.originChainId)
  })
 

  const originBalanceNormalized = formatUnits(originData.originBalance, originData.originDecimals);
  if (destination.balanceOfDestinationToken < destination.settlementToken.amount) {
    const normalisedAmount = formatUnits(
      destination.settlementToken.amount,
      destination.settlementToken.decimals
    );
    if (normalisedAmount > originBalanceNormalized) {
      await Telegram.sendMessage({
        chatId: DEFAULT_CHAT_ID,
        text: `Reserve wallet has insufficient balance of ${originData.originToken}. Balance: ${originBalanceNormalized} ${originData.originToken}. Amount needed: ${normalisedAmount} ${originData.originToken}`,
      });
      throw new Error("Insufficient balance in all reserves");
    }
    const finalTokenInOriginChain = getFinalSettlementAmount({
      destinationBlockchain:destination.destinationBlockchain,
      originBalance:originData.originBalance,
      originDecimals:originData.originDecimals,
      settleAmount:destination.settlementToken.amount,
      settleDecimals:destination.settlementToken.decimals,
      settleTokenAddress:destination.settlementToken.address
    })
    const debrige = new Debridge();
    const originChainInDebridge = Debridge.ValidChains[originData.originBlockchain];
    const dstChainInDebridge = Debridge.ValidChains[destination.destinationBlockchain];
    const order = await debrige.createOrder(
     {
      ...orderParams,
      srcChainId: originChainInDebridge.internalChainId.toString(),
      dstChainId: dstChainInDebridge.internalChainId.toString(),
      srcChainTokenInAmount: finalTokenInOriginChain.toString(),
     }
    );
    console.log("order",order)
    const gasHash = await originWalletClient.sendTransaction({
      to:getAddress("reserve"),
      value:BigInt(order.tx.value),
    })
    await originData.originClient.waitForTransactionReceipt({
      hash: gasHash as `0x${string}`,
    });
    const bridgeHash = await createTransaction(
      [
        {
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [order.tx.to, finalTokenInOriginChain],
          }),
          to: originData.originToken,
          value: "0",
        },
        {
          data: order.tx.data,
          to: order.tx.to,
          value: order.tx.value,
        },
      ],
      "reserve",
      originData.originChainId,
      originData.originBlockchain
    );
    await originData.originClient.waitForTransactionReceipt({
      hash: bridgeHash as `0x${string}`,
    });
    console.log("approximate fulfillment delay", order.order.approximateFulfillmentDelay)
    console.log("sleeping for", order.order.approximateFulfillmentDelay * 1000
      + "milliseconds loading...."
    )
    await sleep(order.order.approximateFulfillmentDelay * 1000);
  }
}
export async function  sendSolanaTokenTransaction({from,to,token,amount,blockchain}:{from:string,to:string,token:string,amount:bigint,blockchain:Extract<BlockchainName,"solana" | "solana-devnet">}) {
  const connection = blockchainClient(blockchain) as Connection
  const mintAddress = new PublicKey(token)
  const signer = Keypair.fromSecretKey(new Uint8Array(bs58.decode(getSigner("solana_reserve"))))

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    signer,
    mintAddress,
    new PublicKey(from)
  )
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    signer,
    mintAddress,
    new PublicKey(to)
  )
  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      signer.publicKey,
      amount,
    ),
  );
  return transaction

}
export  function getFinalSettlementAmount({
destinationBlockchain,
originBalance,
originDecimals,
settleAmount,
settleDecimals,
settleTokenAddress
}:{ settleAmount:bigint,
  settleDecimals:number,
  originBalance:bigint
  originDecimals:number,
  settleTokenAddress:string,

  destinationBlockchain:BlockchainName}): bigint {
  const settleAmountNormalized = parseFloat(formatUnits(settleAmount, settleDecimals));
  const originBalanceNormalized = parseFloat(formatUnits(originBalance, originDecimals));
  const originBalanceNormalizedReadyToSend = parseFloat(formatUnits(BigInt(1000), originDecimals));
  if(settleAmountNormalized > originBalanceNormalized){
    throw new Error("Insufficient balance in all reserves");
  }
  if(USD_TOKEN_ADDRESSES[destinationBlockchain] === settleTokenAddress){
    if(USD_REFILEMENT_AMOUNT[destinationBlockchain] >= settleAmount){
      return USD_REFILEMENT_AMOUNT[destinationBlockchain] 
    }
    else {
      throw new Error("Insufficient balance in all reserves");
    }
  }
  if (originBalanceNormalizedReadyToSend >= settleAmountNormalized) {
    return settleAmount;
  }
  if(settleAmountNormalized > originBalanceNormalizedReadyToSend){
    throw new Error("Insufficient balance in all reserves");
  }
  return BigInt(0);
}
export async function routeTransaction({
  type,
  blockchainName,
  chainId,
  settlementToken,
  transactionData,
}: {
  type: WalletType;
  blockchainName: BlockchainName;
  chainId: ChainId;
  settlementToken?: { address: string; decimals: number; amount: bigint };
  transactionData:
    | MetaTransactionData[]
    | TronTransactionData
    | SolanaTransaction[];
}): Promise<string> {
  const client = await blockchainClient(blockchainName, chainId);

  const {
    originToken,
    originBalance,
    originDecimals,
    originBalanceNormalized,
    originChainId,
    originBlockchain,
    originClient
  } = await getOriginData("reserve");
  if (!client) {
    throw new Error("Invalid blockchain name or chain id");
  }
  switch (type) {
    case "gasless":
    case "reserve": {
      const txData = transactionData as MetaTransactionData[];
      if (chainId === 0) {
        throw new Error("Chain Id 0 is not supported");
      }
      const evmClient = client as PublicClient;
      if (settlementToken) {
        const balanceOfToken = await evmClient.readContract({
          abi: erc20Abi,
          address: settlementToken.address,
          functionName: "balanceOf",
          args: [getAddress(type)],
        });
        const settleAmountNormalized = Number.parseFloat(formatUnits(
          settlementToken.amount,
          settlementToken.decimals
        ))
        if(balanceOfToken < settlementToken.amount){
          await createDeBridgeTransaction({
           dstChainOrderAuthorityAddress:getAddress(type),
           dstChainTokenOut:settlementToken.address,
           dstChainTokenOutRecipient:getAddress(type),
           srcChainOrderAuthorityAddress:getAddress("reserve"),
           srcChainTokenIn:originToken

          },{
            balanceOfDestinationToken:BigInt(balanceOfToken),
            destinationBlockchain:blockchainName,
            settlementToken
          },{
            originBalance,
            originBlockchain,
            originChainId,
            originClient,
            originDecimals,
            originToken
          })
        }
      }
      return createTransaction(txData, type, chainId, blockchainName);
    }
    case "tron_gasless":
    case "tron_reserve": {
      const trx = transactionData as TronTransactionData;
      return createTronTransaction(trx, "nile-tron", type);
    }
    case "solana_gasless":
    case "solana_reserve": {
      const solData = transactionData as SolanaTransaction[];
      const connection = blockchainClient(blockchainName as Extract<BlockchainName,"solana" | "solana-devnet">,0) as Connection
      if(settlementToken){
        const tokenAccountAddress = await getAssociatedTokenAddress(new PublicKey(settlementToken.address),new PublicKey(getAddress(type)))
        const balanceOfToken = await connection.getTokenAccountBalance(tokenAccountAddress)
        if(BigInt(balanceOfToken.value.amount) < settlementToken.amount){
          const normalisedAmount = formatUnits(
            settlementToken.amount,
            settlementToken.decimals
          );
          if (normalisedAmount > originBalanceNormalized) {
            await Telegram.sendMessage({
              chatId: DEFAULT_CHAT_ID,
              text: `${type} wallet has insufficient balance of ${originToken}. Balance: ${originBalanceNormalized} ${originToken}. Amount needed: ${normalisedAmount} ${originToken}`,
            });
            throw new Error("Insufficient balance in all reserves");
          }
          await createDeBridgeTransaction({
            dstChainOrderAuthorityAddress:getAddress(type),
            dstChainTokenOut:settlementToken.address,
            dstChainTokenOutRecipient:getAddress(type),
            srcChainOrderAuthorityAddress:getAddress("reserve"),
            srcChainTokenIn:originToken
 
           },{
             balanceOfDestinationToken:BigInt(balanceOfToken.value.amount),
             destinationBlockchain:blockchainName,
             settlementToken
           },{
             originBalance,
             originBlockchain,
             originChainId,
             originClient,
             originDecimals,
             originToken
           }) 
        }
      }
      return createSolanaTransaction(solData, type, blockchainName as Extract<BlockchainName,"solana" | "solana-devnet">);
    }
  }
  return "";
}
export async function createTransaction(
  transactionDatas: MetaTransactionData[],
  type: WalletType,
  chainId: ChainId,
  blockchainName: BlockchainName
): Promise<string> {
  const signer = getSigner(type);
  if (!signer) {
    throw new Error("No signer key found");
  }
  const safeAddress = getAddress(type);
  const rpcUrl = getRPC(chainId);
  const protocolKit = await Safe.default.init({
    provider: rpcUrl,
    signer: signer,
    safeAddress: safeAddress,
  });
  const safeTransactionProtocol = await protocolKit.createTransaction({
    transactions: transactionDatas,
  });
  const executeTxResponse = await protocolKit.executeTransaction(
    safeTransactionProtocol
  );

  // //trigger events
  if (executeTxResponse.hash) {
    await bus.publish(
      Resource.InternalEventBus.name,
      InternalEvents.PaymentCreated.OnChain,
      {
        metadata: {
          chainId: chainId,
          walletAddress: safeAddress,
          tokenAddress: USD_TOKEN_ADDRESSES[blockchainName],
          blockchainName: blockchainName,
        },
      }
    );
  }
  console.log({transactionHash:executeTxResponse.hash})
  return executeTxResponse.hash;
}

export async function createTronTransaction(
  trx: TronTransactionData,
  blockchainName: Extract<BlockchainName, "nile-tron" | "tron">,
  type: Extract<WalletType, "tron_gasless" | "tron_reserve">
): Promise<string> {
  const tronWeb = tronClient(blockchainName);
  const privateKey = getSigner(type);
  tronWeb.setPrivateKey(privateKey);
  const signedTx = await tronWeb.trx.sign(trx);
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  return result.transaction.txID;
}


export async function createSolanaTransaction(
  transactionDatas: SolanaTransaction[],
  type: Extract<WalletType,"solana_gasless" | "solana_reserve">,
  blockchainName: Extract<BlockchainName,"solana" | "solana-devnet">
): Promise<string> {
  const rpcUrl = getSolanaRPC(blockchainName)

  const connection = new Connection(rpcUrl,{
    commitment:"confirmed"
  });
  const fromKeyPair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(getSigner(type))));
  const finalTransaction = new SolanaTransaction()
  transactionDatas.forEach(data=>{
    finalTransaction.add(
      data
    )
  })
  const messageV0 = new TransactionMessage({
    payerKey: fromKeyPair.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: finalTransaction.instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([fromKeyPair]);
  const txid = await connection.sendTransaction(transaction);
  console.log(`transaction id........ : ${txid}`);
  if(txid){
    await bus.publish(
      Resource.InternalEventBus.name,
      InternalEvents.PaymentCreated.OnChain,
      {
        metadata: {
          chainId: 0,
          walletType: type,
          tokenAddress: USD_TOKEN_ADDRESSES[blockchainName],
          blockchainName: blockchainName,
        },
      }
    ); 
  }
  return txid
}
