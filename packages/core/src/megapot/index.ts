import { evmClient } from "@/blockchain-client";
import { TransactionData, routeTransaction } from "@/wallet";
import { BlockchainName, ChainId } from "@/wallet/types";
import { Resource } from "sst";
import { encodeFunctionData, erc20Abi, parseAbi, zeroAddress } from "viem";

const MEGAPOT_CONSTANTS = {
	default: {
		TOKEN_ADDRESS:
			"0xA4253E7C13525287C56550b8708100f93E60509f" as `0x${string}`,
		JACKPOT_ADDRESS:
			"0x6f03c7BCaDAdBf5E6F5900DA3d56AdD8FbDac5De" as `0x${string}`,
	},
	production: {
		TOKEN_ADDRESS:
			"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as `0x${string}`,
		JACKPOT_ADDRESS:
			"0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95" as `0x${string}`,
	},
} as const;

const getMegapotConstants = () => {
	const env = Resource.App.stage === "production" ? "production" : "default";
	return MEGAPOT_CONSTANTS[env];
};
export class MegapotWrapper {
	static getConstants = getMegapotConstants;

	constructor(
		private chainId: ChainId,
		private blockchainName: BlockchainName,
	) {}

	getTokenAddress() {
		const constants = getMegapotConstants();
		return constants.TOKEN_ADDRESS;
	}
	async getTokenDecimals() {
		const client = evmClient(this.chainId);
		return client.readContract({
			abi: erc20Abi,
			functionName: "decimals",
			address: this.getTokenAddress(),
		});
	}

	async purchaseTicket(value: bigint, recipient: string, referrer?: string) {
		const decimals = await this.getTokenDecimals();
		const constants = getMegapotConstants();

		const txData = encodeFunctionData({
			abi: erc20Abi,
			functionName: "approve",
			args: [constants.JACKPOT_ADDRESS, value],
		});

		const txPurchaseTicketData = encodeFunctionData({
			abi: parseAbi([
				"function purchaseTickets(address referrer,uint256 value,address recipient)",
			]),
			functionName: "purchaseTickets",
			args: [referrer ?? zeroAddress, value, recipient],
		});
		const tx: TransactionData[] = [
			{
				data: txData,
				to: this.getTokenAddress(),
				value: "0",
			},
			{
				data: txPurchaseTicketData,
				to: constants.JACKPOT_ADDRESS,
				value: "0",
			},
		];
		const hash = await routeTransaction({
			type: "reserve",
			blockchainName: this.blockchainName,
			chainId: this.chainId,
			transactionData: tx,
			settlementToken: {
				address: this.getTokenAddress(),
				amount: value,
				decimals: 6,
			},
		});
		return hash;
	}
}
