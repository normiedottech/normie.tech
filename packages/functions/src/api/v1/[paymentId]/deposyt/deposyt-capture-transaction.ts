import { Hono } from "hono";
import { z } from "zod";

import { payoutMetadataSchema } from "@normietech/core/config/project-registry/index";
import {
	getPayoutSettings,
	getProjectById,
} from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import {
	paymentUsers,
	payoutBalance,
	projects,
	transactionSelectSchemaWithPaymentUser,
	transactions,
} from "@normietech/core/database/schema/index";
import {
	DeposytClient,
	QueryTransaction,
} from "@normietech/core/deposyt/index";
import { extractFeesFromAmountInFiat } from "@normietech/core/util/fees";
import { removePercentageFromNumber } from "@normietech/core/util/percentage";
import {
	TransactionData,
	getAddress,
	routeTransaction,
	sendSolanaTokenTransaction,
	sendTokenData,
} from "@normietech/core/wallet/index";
import {
	ChainIdSchema,
	USD_TOKEN_ADDRESSES,
	blockchainNamesSchema,
	validBlockchains,
	validChainIds,
} from "@normietech/core/wallet/types";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Resource } from "sst";

const deposytCaptureOrderApp = new Hono();

export const deposytCaptureTransactionBodySchema = z.object({
	// Payment specific fields
	transactionId: z.string().min(1, "Transaction ID is required"),
	paymentToken: z.string().min(1, "Payment token is required"),

	// Customer information
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().optional(),

	// Address information
	address1: z.string().min(1, "Street address is required"),
	address2: z.string().optional(),
	city: z.string().min(1, "City is required"),
	country: z.string().min(1, "Country is required"),
	state: z.string().min(1, "State/Province is required"),
	zip: z.string().min(1, "ZIP code is required"),

	// Contact information
	email: z.string().email("Invalid email address").min(1, "Email is required"),
	phone: z.string().optional(),
});
export const handleOnChainTransaction = async (
	paymentProcessorTransaction: QueryTransaction,
	transactionId: string,
	transaction: typeof transactions.$inferSelect,
	deposytBody: z.infer<typeof deposytCaptureTransactionBodySchema>,
) => {
	let newTransaction = { ...transaction };
	let newPaymentUser = {
		id: nanoid(10),
		email: deposytBody.email,
		name: deposytBody.first_name + " " + deposytBody.last_name,
		phoneNumber: deposytBody.phone,
		projectId: transaction.projectId,
	} as typeof paymentUsers.$inferInsert;
	const saleTransaction = paymentProcessorTransaction.action.find(
		(action) => action.action_type === "auth",
	);
	if (!transaction.projectId) {
		throw new Error("Project id not found");
	}
	if (!saleTransaction) {
		throw new Error("Sale transaction not found");
	}

	const project = await db.query.projects.findFirst({
		where: eq(projects.projectId, transaction.projectId),
		with: {
			payoutSettings: true,
			projectSettings: true,
			payoutBalance: true,
		},
	});
	const payoutSetting = project?.payoutSettings;
	const projectSetting = project?.projectSettings;
	const payoutBalanceOfProject = project?.payoutBalance;
	if (!payoutSetting || !projectSetting) {
		throw new Error("Payout or project setting not found");
	}
	if (!payoutBalanceOfProject) {
		throw new Error("Payout balance not found");
	}
	const isInstant =
		payoutSetting.payoutPeriod === "instant" ||
		payoutSetting.settlementType === "smart-contract";

	newTransaction.externalPaymentProviderId =
		paymentProcessorTransaction.transaction_id;
	newPaymentUser.externalId = paymentProcessorTransaction.transaction_id;
	newTransaction.status = "fiat-confirmed";

	await db.batch([
		db.insert(paymentUsers).values(newPaymentUser),
		db
			.update(transactions)
			.set({
				...newTransaction,
			})
			.where(eq(transactions.id, transactionId)),
	]);
	const { finalAmount, totalFees, processorFee, additionalFee } =
		extractFeesFromAmountInFiat(
			newTransaction.amountInFiat ?? 0,
			"deposyt",
			project.feePercentage ?? 0,
			projectSetting.ignorePaymentProcessorFees ?? false,
		);
	transaction.finalAmountInFiat = finalAmount;
	transaction.paymentProcessFeesInFiat = processorFee;
	transaction.platformFeesInFiat = additionalFee;
	console.log({ finalAmount, totalFees, processorFee, additionalFee });
	console.log({ transaction });
	let onChainTxId: string | undefined;
	switch (project.projectId) {
		default:
			{
				if (project.settlementType === "smart-contract") {
					throw new Error(
						"Smart contract settlement not supported for this project",
					);
				}
				if (!payoutSetting.payoutAddress) {
					throw new Error(
						"No payout address provided, payout address required for this project",
					);
				}
				let payoutAddress = payoutSetting.payoutAddress;
				const { data: checkoutMetadata, success } =
					payoutMetadataSchema.safeParse(transaction.metadataJson);
				if (
					success &&
					checkoutMetadata.payoutAddress.toLowerCase() !==
						payoutAddress.toLowerCase()
				) {
					payoutAddress = checkoutMetadata.payoutAddress;
				}
				const finalTransactions = [] as TransactionData[];
				transaction.amountInToken = Math.floor(
					parseFloat(
						(
							transaction.finalAmountInFiat *
							10 ** transaction.decimals
						).toString(),
					),
				);
				console.log("transaction.amountInToken", transaction.amountInToken);
				if (project.referral) {
					const referralProject = await getProjectById(project.referral);
					const referralSettings = await getPayoutSettings(project.referral);
					if (referralProject && referralSettings.payoutAddress) {
						transaction.referralFeesInFiat =
							transaction.platformFeesInFiat -
							removePercentageFromNumber(
								transaction.platformFeesInFiat,
								project.referralPercentage,
							);
						transaction.platformFeesInFiat = removePercentageFromNumber(
							transaction.platformFeesInFiat,
							project.referralPercentage,
						);
						transaction.referral = project.referral;
					}
				}
				console.log(
					isInstant,
					validChainIds.includes(payoutSetting.chainId as any),
					validBlockchains.includes(payoutSetting.blockchain),
				);
				if (
					isInstant &&
					validChainIds.includes(payoutSetting.chainId as any) &&
					validBlockchains.includes(payoutSetting.blockchain)
				) {
					const validBlockchainName = blockchainNamesSchema.parse(
						payoutSetting.blockchain,
					);
					const validChainId = ChainIdSchema.parse(payoutSetting.chainId);
					switch (validBlockchainName) {
						case "solana":
						case "solana-devnet": {
							let finalTransaction = await sendSolanaTokenTransaction({
								amount: BigInt(transaction.amountInToken),
								from: getAddress("solana_reserve"),
								to: payoutAddress,
								token: USD_TOKEN_ADDRESSES[validBlockchainName],
								blockchain: validBlockchainName,
							});
							onChainTxId = await routeTransaction({
								blockchainName: validBlockchainName,
								chainId: validChainId,
								transactionData: [finalTransaction],
								type: "solana_reserve",
								settlementToken: {
									address: USD_TOKEN_ADDRESSES[validBlockchainName],
									amount: BigInt(transaction.amountInToken),
									decimals: 6,
								},
							});
							break;
						}
						case "arbitrum-one":
						case "celo":
						case "ethereum":
						case "evm":
						case "optimism":
						case "polygon":
						case "base":
						case "base-sepolia":
						case "celo-alfajores":
						case "gnosis":
						case "sepolia-eth": {
							finalTransactions.push({
								data: sendTokenData(payoutAddress, transaction.amountInToken),
								to: USD_TOKEN_ADDRESSES[validBlockchainName],
								value: "0",
							});
							console.log("finalTransactions", finalTransactions);

							onChainTxId = await routeTransaction({
								blockchainName: validBlockchainName,
								chainId: validChainId,
								transactionData: finalTransactions,
								type: "reserve",
								settlementToken: {
									address: USD_TOKEN_ADDRESSES[validBlockchainName],
									amount: BigInt(transaction.amountInToken),
									decimals: transaction.decimals,
								},
							});
							break;
						}
						case "nile-tron":
						case "tron":
							throw new Error("Tron is not supported");
					}
				}
				break;
			}

			break;
	}

	await db.batch([
		db
			.update(transactions)
			.set({
				...transaction,
				blockchainTransactionId: onChainTxId,
				status: onChainTxId ? "confirmed-onchain" : "fiat-confirmed",
			})
			.where(eq(transactions.id, newTransaction.id)),
		db
			.update(payoutBalance)
			.set({
				balance: isInstant
					? payoutBalanceOfProject.balance + 0
					: payoutBalanceOfProject.balance +
						(newTransaction.finalAmountInFiat ?? 0),
				paidOut: isInstant
					? onChainTxId
						? payoutBalanceOfProject.paidOut +
							(newTransaction.finalAmountInFiat ?? 0)
						: payoutBalanceOfProject.paidOut + 0
					: payoutBalanceOfProject.paidOut + 0,
			})
			.where(eq(payoutBalance.projectId, transaction.projectId)),
	]);
};

type DeposytCaptureTransactionBody = z.infer<
	typeof deposytCaptureTransactionBodySchema
>;

deposytCaptureOrderApp.post("/", async (c) => {
	const body = await c.req.json();
	const validatedBody = deposytCaptureTransactionBodySchema.parse(body);
	const client = new DeposytClient(Resource.DEPOSYT_PRIVATE_KEY.value);
	const transaction = await db.query.transactions.findFirst({
		where: eq(transactions.id, validatedBody.transactionId),
	});
	if (!transaction) {
		return c.json({ error: "Transaction not found" }, 404);
	}
	if (transaction.amountInFiat === null) {
		return c.json({ error: "Transaction amount is not set" }, 400);
	}
	if (transaction.lock) {
		return c.json({ error: "Transaction is locked" }, 400);
	}
	if (transaction.status === "fiat-confirmed") {
		return c.json({ error: "Transaction is already confirmed" }, 400);
	}

	await db
		.update(transactions)
		.set({
			lock: true,
		})
		.where(eq(transactions.id, validatedBody.transactionId));

	const response = await client.authorize({
		type: "sale",
		amount: transaction?.amountInFiat.toString(),
		payment_token: validatedBody.paymentToken,
		address1: validatedBody.address1,
		address2: validatedBody.address2,
		city: validatedBody.city,
		state: validatedBody.state,
		zip: validatedBody.zip,
		country: validatedBody.country,
		currency: "USD",
		email: validatedBody.email,
		phone: validatedBody.phone,
		first_name: validatedBody.first_name,
		last_name: validatedBody.last_name,
	});
	if (response.response.toString() === "2") {
		await db
			.update(transactions)
			.set({
				status: "cancelled",
				lock: false,
			})
			.where(eq(transactions.id, validatedBody.transactionId));
		return c.json({ error: "Transaction not approved, please try again" }, 400);
	}
	if (response.response.toString() === "3") {
		await db
			.update(transactions)
			.set({
				status: "cancelled",
				lock: false,
			})
			.where(eq(transactions.id, validatedBody.transactionId));
		return c.json({ error: "Transaction failed" }, 400);
	}
	if (response.transactionid) {
		const paymentProcessorTransaction = await client.queryTransactions({
			transaction_id: response.transactionid,
		});
		if (!transaction.lock) {
			try {
				await handleOnChainTransaction(
					paymentProcessorTransaction.transaction[0],
					validatedBody.transactionId,
					transaction,
					validatedBody,
				);
			} catch (error) {
				await db
					.update(transactions)
					.set({
						lock: false,
					})
					.where(eq(transactions.id, validatedBody.transactionId));
				console.error(error);
				return c.json({ error: "Transaction failed" }, 400);
			}
		}
	}
	await db
		.update(transactions)
		.set({
			lock: false,
		})
		.where(eq(transactions.id, validatedBody.transactionId));
	return c.json({ message: "Transaction captured" }, 200);
});

export default deposytCaptureOrderApp;
