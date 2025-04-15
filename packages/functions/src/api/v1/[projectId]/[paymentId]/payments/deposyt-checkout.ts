import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import {
	ProjectRegistryKey,
	checkoutBodySchema,
	payoutMetadataSchema,
} from "@normietech/core/config/project-registry/index";
import { getPayoutSettings } from "@normietech/core/config/project-registry/utils";
import {
	products,
	projectSettings,
	projects,
	transactions,
} from "@normietech/core/database/schema/index";
import { blockchainNamesSchema } from "@normietech/core/wallet/types";
import { USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { nanoid } from "nanoid";
import { z } from "zod";
import { validateCheckout } from ".";

export const deposytCheckout = async (
	body: z.infer<typeof checkoutBodySchema>,
	projectId: ProjectRegistryKey | string,
	transaction: typeof transactions.$inferInsert | undefined,
	projectSetting: typeof projectSettings.$inferSelect | undefined,
	project: typeof projects.$inferSelect | undefined,
	metadataId: string,
	productId: string | undefined,
) => {
	let newTransaction = await validateCheckout(
		body,
		projectId,
		transaction,
		projectSetting,
		project,
	);
	if (projectSetting?.firstPreferredPaymentProcessor !== "deposyt") {
		throw new Error(
			"Deposyt is not the first preferred payment processor for this project",
		);
	}
	const payoutSetting = await getPayoutSettings(projectId);
	switch (projectId) {
		default:
			if (payoutSetting.settlementType === "smart-contract") {
				throw new Error("Smart contract settlement not supported");
			}
			const token =
				USD_TOKEN_ADDRESSES[
					blockchainNamesSchema.parse(payoutSetting.blockchain)
				];

			const decimals = await getDecimalsOfToken(
				payoutSetting.blockchain,
				token,
				payoutSetting.chainId,
			);

			const finalAmountInToken =
				(newTransaction.amountInFiat ?? body.amount / 100) * 10 ** decimals;
			newTransaction = {
				...newTransaction,
				metadataJson: JSON.stringify(body.metadata),
				token: token,
				amountInToken: finalAmountInToken,
				decimals: decimals,
			};
			break;
	}
	const finalProducts = {
		id: nanoid(14),
		name: body.name,
		description: body.description,
		priceInFiat: newTransaction.amountInFiat ?? body.amount / 100,
		projectId: projectId,
	} as typeof products.$inferSelect;

	newTransaction = {
		...newTransaction,
		productId: productId || finalProducts.id,
	};
	return {
		transaction: newTransaction,
		finalProducts: finalProducts,
	};
};
