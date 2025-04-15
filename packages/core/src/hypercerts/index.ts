import { LOOKS_RARE_PROTOCOL } from "@/abi/voice-deck";
import {
	HypercertExchangeClient,
	Maker,
} from "@hypercerts-org/marketplace-sdk";
import { BytesLike, ethers } from "ethers";
import { BaseWallet } from "ethers/wallet";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { encodeFunctionData } from "viem/utils";
import {
	createTransaction,
	getRPC,
	getSigner,
	routeTransaction,
} from "../wallet/index";
import { ChainId, WalletType } from "../wallet/types";
export interface HypercertOrder extends Maker {
	signature: string;
}
export class HypercertWrapper {
	chainId: ChainId;
	rpcUrl: string;
	client: HypercertExchangeClient;
	constructor(chainId: ChainId, walletType: WalletType) {
		this.chainId = chainId;
		this.rpcUrl = getRPC(chainId);
		const provider = new ethers.JsonRpcProvider(this.rpcUrl);
		const signingKey = new ethers.Wallet(getSigner(walletType));
		if (chainId === 42161) {
			throw new Error("Arbitrum or chain id 42161 is not supported");
		}
		this.client = new HypercertExchangeClient(10, provider, signingKey);
	}
	async buyHypercert(
		order: HypercertOrder,
		recipient: string,
		amount: bigint,
		approvalAmount: bigint,
		amountAfterFees: bigint,
	) {
		console.log("addresesess", this.client.addresses);
		console.log("amount", amount);
		console.log(amountAfterFees, "amountAfterFees");

		console.log({ approvalAmount });
		console.log(this.client.addresses.EXCHANGE_V2);
		const amountInDollars = Math.floor(
			parseFloat(formatUnits(approvalAmount, 6)),
		);
		const amountAfterFeesInDollars = parseFloat(
			formatUnits(amountAfterFees, 6),
		);

		const pricePerUnit =
			amountInDollars / Math.floor(parseFloat(amount.toString()));
		console.log({ amountInDollars });
		console.log({ amount });
		console.log({ pricePerUnit });
		console.log({ amountAfterFeesInDollars });
		const amountUnitsToBuyAfterFees = Math.trunc(
			amountAfterFeesInDollars / pricePerUnit,
		);
		console.log({ amountUnitsToBuyAfterFees });
		const takerOrder = this.client.createFractionalSaleTakerBid(
			order,
			recipient,
			amountUnitsToBuyAfterFees,
			order.price,
		);

		console.log({ takerOrder });

		const approveTxData = encodeFunctionData({
			abi: erc20Abi,
			functionName: "approve",
			args: [this.client.addresses.EXCHANGE_V2, approvalAmount],
		});
		// console.log({approveTxData})

		const orderTx = encodeFunctionData({
			abi: LOOKS_RARE_PROTOCOL,
			functionName: "executeTakerBid",
			args: [
				{
					additionalParameters:
						takerOrder.additionalParameters as `0x${string}`,
					recipient: takerOrder.recipient as `0x${string}`,
				},
				{
					additionalParameters: order.additionalParameters as `0x${string}`,
					amounts: order.amounts as bigint[],
					collection: order.collection as `0x${string}`,
					collectionType: order.collectionType,
					currency: order.currency as `0x${string}`,
					endTime: order.endTime as bigint,
					globalNonce: order.globalNonce as bigint,
					itemIds: order.itemIds as bigint[],
					orderNonce: order.orderNonce as bigint,
					price: order.price as bigint,
					quoteType: order.quoteType,
					signer: order.signer as `0x${string}`,
					startTime: order.startTime as bigint,
					strategyId: BigInt(order.strategyId.valueOf()),
					subsetNonce: order.subsetNonce as bigint,
				},
				order.signature as `0x${string}`,
				{
					proof: [],
					root: "0x0000000000000000000000000000000000000000000000000000000000000000",
				},
			],
		});
		const approveTx = await routeTransaction({
			blockchainName: "optimism",
			chainId: this.chainId,
			type: "reserve",
			transactionData: [
				{
					to: order.currency,
					data: approveTxData,
					value: "0",
				},
				{
					data: orderTx,
					to: this.client.addresses.EXCHANGE_V2,
					value: "0",
				},
			],
			settlementToken: {
				address: order.currency,
				amount: approvalAmount,
				decimals: 6,
			},
		});

		return approveTx;
	}
}
