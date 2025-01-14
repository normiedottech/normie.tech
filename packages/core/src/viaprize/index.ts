import { ERC20_PERMIT_ABI } from "@/abi/erc20";
import { createTransaction, createTronTransaction, getRPC } from "@/wallet";
import { BlockchainName, ChainId, USD_TOKEN_ADDRESSES } from "@/wallet/types";
import { binary } from "drizzle-orm/mysql-core";
import { encodeFunctionData, erc20Abi, parseAbi, parseSignature, recoverAddress } from "viem";

export class ViaprizeWrapper {
  rpcUrl: string;
  blockchain: BlockchainName;
  chainId: ChainId
  constructor(chainId: ChainId,blockchain: BlockchainName) {
    this.chainId = chainId;
    this.rpcUrl = getRPC(chainId);
    this.blockchain = blockchain;
  }
  async fundPrize(
    userAddress: `0x${string}`,
    contractAddress: `0x${string}`,
    amount: bigint,
    deadline: number,
    signature: `0x${string}`,
    ethSignedMessage: `0x${string}`,
    amountApproved: bigint
    
  ) {
    const { r, s, v } = parseSignature(signature);
   
    const sender = await recoverAddress({
      hash: ethSignedMessage,
      signature: signature
    })
    console.log({sender})
    console.log({userAddress})
    console.log( sender,
      contractAddress,
      amount,
      BigInt(deadline),
      Number.parseInt(v?.toString() ?? "0"),
      r,
      s)
    const permitData = encodeFunctionData({
      abi: ERC20_PERMIT_ABI,
      functionName:"permit",
      args:[
        sender,
        contractAddress,
        amountApproved,
        BigInt(deadline),
        Number.parseInt(v?.toString() ?? "0"),
        r,
        s
      ]
    })
    const txDataReserveToUser = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [userAddress, amount],
    });
    const fundUsdcAbi = parseAbi([
      "function addUsdcFunds(uint256 _amountUsdc,address _sender, bool _fiatPayment)",
    ]);



    const txDataFundUsdc = encodeFunctionData({
      abi: fundUsdcAbi,
      functionName: "addUsdcFunds",
      args: [
        amount,
        sender,
        true,
      ],
    });

    const hash = await createTransaction(
      [
        {
          data: permitData,
          to: USD_TOKEN_ADDRESSES[this.blockchain],
          value: "0",
        },
        {
          data: txDataReserveToUser,
          to: USD_TOKEN_ADDRESSES[this.blockchain],
          value: "0",
        },
        {
          data: txDataFundUsdc,
          to: contractAddress,
          value: "0",
        },
      ],
      "reserve",
      this.chainId,
      this.blockchain
    );
    return hash;
  }
}
