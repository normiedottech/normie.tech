import {
	checkoutBodySchema,
	ProjectRegistryKey,
} from "@normietech/core/config/project-registry/index";
import { getProjectBalanceById } from "@normietech/core/config/project-registry/utils";
import { db } from "@normietech/core/database/index";
import { projectSettings } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { transactions } from "@normietech/core/database/schema/index";
import { projects } from "@normietech/core/database/schema/index";
import { getAmountInFiatWithFees } from "@normietech/core/util/fees";
import { z } from "zod";
export const validateCheckout = async (
	body: z.infer<typeof checkoutBodySchema>,
	projectId: ProjectRegistryKey | string,
	transaction: typeof transactions.$inferInsert | undefined,
	projectSetting: typeof projectSettings.$inferSelect | undefined,
	project: typeof projects.$inferSelect | undefined,
) => {
	let newTransaction = { ...transaction };
	newTransaction = {
		...transaction,
		chainId: body.chainId,
		currencyInFiat: "USD",
		amountInFiat: body.amount / 100,
	};
	if (!project) {
		throw new Error("Project not found");
	}

	if (project && !project.fiatActive) {
		throw new Error("Fiat payments are disabled for this project");
	}

	if (projectSetting?.forwardFeesToUsersInCheckout) {
		const amountInFiatWithFees = getAmountInFiatWithFees(
			body.amount / 100,
			"paypal",
			project?.feePercentage,
			projectSetting?.ignorePaymentProcessorFees ?? false,
		).toFixed(2);
		newTransaction.amountInFiat = Number(amountInFiatWithFees);
	}
	const balance = await getProjectBalanceById(projectId);

	if (
		projectSetting?.limitToFiatVolume &&
		projectSetting.limitToFiatVolume > 0
	) {
		if (Math.trunc(balance.paidOut) >= projectSetting?.limitToFiatVolume) {
			await db
				.update(projects)
				.set({ fiatActive: false })
				.where(eq(projects.projectId, projectId));
			throw new Error(
				"As you exceeded your limit volume, Fiat payments are disabled for this project",
			);
		} else if (
			Math.trunc(balance.paidOut) + (newTransaction.amountInFiat ?? 0) >
			projectSetting?.limitToFiatVolume
		) {
			throw new Error(
				`Your Entered Amounts is reaching its Fiat Volume Limit: ${projectSetting.limitToFiatVolume}, Remaining: ${projectSetting.limitToFiatVolume - Math.trunc(balance.paidOut)}`,
			);
		}
	}
	return newTransaction;
};
