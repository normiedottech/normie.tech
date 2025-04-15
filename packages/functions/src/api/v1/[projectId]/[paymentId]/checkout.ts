import { withHandler } from "@/utils";
import {
	PROJECT_REGISTRY,
	checkoutBodySchema,
	parseProjectRegistryKey,
} from "@normietech/core/config/project-registry/index";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@normietech/core/database/index";
import {
	products,
	productsInsertSchema,
	projectSettings,
	projects,
	transactions,
	transactionsInsertSchema,
} from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";

import { nanoid } from "nanoid";

import { getFrontendDomain } from "@normietech/core/config/index";
import {
	getPayoutSettings,
	getProjectById,
} from "@normietech/core/config/project-registry/utils";
import { WebhookEvents } from "@normietech/core/event";
import { Resource } from "sst";
import { bus } from "sst/aws/bus";
import { deposytCheckout } from "./payments/deposyt-checkout";
import { paypalCheckout } from "./payments/paypal-checkout";
import { squareCheckout } from "./payments/squreup-checkout";
import { stripeCheckout } from "./payments/stripe-checkout";

const checkoutApp = new Hono();

const DOMAIN = getFrontendDomain();
// Route for processing transaction and creating a Stripe checkout session
checkoutApp.post(
	"/",
	withHandler(async (c) => {
		const { projectId: projectIdParam, paymentId: paymentIdParam } =
			c.req.param<any>();

		if (!projectIdParam || !paymentIdParam) {
			return c.json({ error: "Missing path parameters" }, 400);
		}
		const projectId = await parseProjectRegistryKey(projectIdParam);
		const payoutSetting = await getPayoutSettings(projectId);
		const bodyRaw = await c.req.json();
		let body = checkoutBodySchema.parse(bodyRaw);

		const metadataId = body.customId || nanoid(20);

		const [projectSetting, project] = await db.batch([
			db.query.projectSettings.findFirst({
				where: eq(projectSettings.projectId, projectId),
			}),
			db.query.projects.findFirst({ where: eq(projects.projectId, projectId) }),
		]);

		if (project && !project.fiatActive) {
			return c.json(
				{ error: "Fiat payments are disabled for this project" },
				400,
			);
		}
		if (!body.blockChainName) {
			body.blockChainName = payoutSetting.blockchain;
		}
		if (!body.chainId) {
			body.chainId = payoutSetting.chainId;
		}

		let transaction: typeof transactions.$inferInsert = {
			blockChainName: body.blockChainName,
			projectId: projectId,
			paymentId: "0",
			extraMetadataJson: JSON.stringify(body.extraMetadata),
			chainId: body.chainId,
			amountInFiat: body.amount / 100,
			currencyInFiat: "USD",
			id: metadataId,
		};
		let product: typeof products.$inferInsert | undefined;

		let url: string | undefined | null;
		let externalId: string | undefined | null;
		switch (projectSetting?.firstPreferredPaymentProcessor) {
			case "paypal": {
				const session = await paypalCheckout(
					body,
					projectId,
					transaction,
					projectSetting,
					project,
					metadataId,
					body.productId,
				);
				if (!session.result) {
					throw new Error("Error creating session, result  is undefined");
				}
				url = `${DOMAIN}/checkout/${transaction.id}?orderId=${session.result.id}`;
				product = session.finalProducts;
				externalId = session?.result.id;
				transaction = session?.newTransaction;
				break;
			}
			case "deposyt": {
				const session = await deposytCheckout(
					body,
					projectId,
					transaction,
					projectSetting,
					project,
					metadataId,
					body.productId,
				);
				url = `${DOMAIN}/checkout/${transaction.id}`;
				product = session.finalProducts;
				externalId = undefined;
				break;
			}
			default:
				const session = await paypalCheckout(
					body,
					projectId,
					transaction,
					projectSetting,
					project,
					metadataId,
					body.productId,
				);
				if (!session.result) {
					throw new Error("Error creating session, result  is undefined");
				}
				url = `${DOMAIN}/checkout/${transaction.id}?orderId=${session.result.id}`;
				product = session.finalProducts;
				externalId = session?.result.id;
				transaction = session?.newTransaction;
				break;
		}

		const finalTransaction = transactionsInsertSchema.parse(transaction);
		const finalProduct = productsInsertSchema.parse(product);

		const [_, latestTransaction] = await db.batch([
			db.insert(products).values({
				...finalProduct,
			} as typeof products.$inferInsert),
			db
				.insert(transactions)
				.values({
					...finalTransaction,
					externalPaymentProviderId: externalId,
				})
				.returning(),
		]);
		if (url && externalId) {
			await db
				.update(transactions)
				.set({ externalPaymentProviderId: externalId })
				.where(eq(transactions.id, metadataId));
		}

		console.log("projectId here.....................", projectId);
		await bus.publish(
			Resource.WebhookEventBusV1.name,
			WebhookEvents.Transaction.Pending,
			{
				metadata: {
					projectId: projectId,
					event: "transaction.pending",
				},
				transaction: {
					...latestTransaction[0],
					product: finalProduct,
					externalPaymentProviderId: externalId ?? null,
				} as any,
			},
		);

		return c.json(
			{
				projectId: projectId,
				url: url,
				transactionId: metadataId,
			},
			200,
		);
	}),
);

// Export the checkoutApp as default for serverless deployment compatibility
export default checkoutApp;
