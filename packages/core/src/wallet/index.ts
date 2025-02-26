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
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
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
  solana_gasless: "",
  solana_reserve: "",
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
    | SolanaTransactionData[];
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
  } = await getOriginData(type);

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
        if (balanceOfToken < settlementToken.amount) {
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
          const debrige = new Debridge();
          const originChainInDebridge = Debridge.ValidChains[originBlockchain];
          const dstChainInDebridge = Debridge.ValidChains[blockchainName];
          if (!originChainInDebridge) {
            throw new Error(
              "Invalid origin blockchain does not exist in Debridge"
            );
          }
          if (!dstChainInDebridge) {
            throw new Error(
              "Invalid destination blockchain does not exist in Debridge"
            );
          }

          const order = await debrige.createOrder({
            srcChainId: originChainInDebridge.internalChainId.toString(),
            srcChainTokenIn: originToken,
            srcChainTokenInAmount: settlementToken.amount.toString(),
            dstChainId: dstChainInDebridge.internalChainId.toString(),
            dstChainTokenOut: settlementToken.address,
            dstChainOrderAuthorityAddress: getAddress(type),
            dstChainTokenOutRecipient: getAddress(type),
            srcChainOrderAuthorityAddress: getAddress(type),
          });
          console.log("order", order);
          const bridgeHash = await createTransaction(
            [
              {
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [order.tx.to, settlementToken.amount],
                }),
                to: originToken,
                value: "0",
              },
              {
                data: order.tx.data,
                to: order.tx.to,
                value: order.tx.value,
              },
            ],
            "reserve",
            originChainId,
            originBlockchain
          );
         
          await originClient.waitForTransactionReceipt({
            hash: bridgeHash as `0x${string}`,
          });
          console.log("approximate fulfillment delay", order.order.approximateFulfillmentDelay)
          console.log("sleeping for", order.order.approximateFulfillmentDelay * 1000
            + "milliseconds loading...."
          )
          await sleep(order.order.approximateFulfillmentDelay * 1000);
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

      const solData = transactionData as SolanaTransactionData[];
      return createSolanaTransaction(solData, type, blockchainName);
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
  console.log({ rpcUrl, safeAddress, signer, transactionDatas });
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
    // await bus.publish(
    //   Resource.InternalEventBus.name,
    //   InternalEvents.PaymentCreated.OnChain,
    //   {
    //     metadata: {
    //       chainId: chainId,
    //       walletAddress: safeAddress,
    //       tokenAddress: USD_TOKEN_ADDRESSES[blockchainName],
    //       blockchainName: blockchainName,
    //       // balance: 0,
    //     },
    //   }
    // );
  }

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
  return txid
}
