import { apiKeyMiddleware } from "@/middleware/apiKey";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import { transactions } from "@normietech/core/database/schema/index";
import { and, asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import checkoutApp from "./checkout";
import paymentLinkApp from "./payment-links";
import refundApp from "./refund";

const paymentProjectApp = new Hono();

// Route for getting a single transaction by project, payment, and transaction ID
paymentProjectApp.get("/transactions/:transactionId", async (c) => {
	const { projectId, paymentId, transactionId } = c.req.param<any>();

	if (!projectId || !paymentId || !transactionId) {
		return c.json({ error: "Missing path parameters" }, 400);
	}

	try {
		// const parsedProjectId = await parseProjectRegistryKey(projectId);

		const metadata = await db.query.transactions.findFirst({
			where: and(
				eq(transactions.projectId, projectId),
				eq(transactions.paymentId, "0"),
				eq(transactions.id, transactionId),
			),
			with: {
				paymentUser: true,
			},
		});

		return c.json(
			metadata || { error: "Transaction not found" },
			metadata ? 200 : 404,
		);
	} catch (error) {
		console.error(error);
		return c.json({ error: "Failed to fetch transaction metadata" }, 500);
	}
});

// Route for getting all transactions by project and payment ID
paymentProjectApp.get("/transactions", async (c) => {
	const { projectId, paymentId } = c.req.param<any>();

	if (!projectId || !paymentId) {
		return c.json({ error: "Missing path parameters" }, 400);
	}

	try {
		const parsedProjectId = await parseProjectRegistryKey(projectId);

		const metadata = await db.query.transactions.findMany({
			where: and(eq(transactions.projectId, parsedProjectId)),
			with: {
				paymentUser: true,
			},
			orderBy: desc(transactions.createdAt),
		});

		return c.json(metadata, 200);
	} catch (error) {
		return c.json({ error: "Failed to fetch transactions" }, 500);
	}
});
paymentProjectApp.use("/checkout", apiKeyMiddleware);
paymentProjectApp.route("/checkout", checkoutApp);
paymentProjectApp.use("/refund", apiKeyMiddleware);

paymentProjectApp.route("/payment-links", paymentLinkApp);
paymentProjectApp.route("/refund", refundApp);
// Export app as default for serverless framework compatibility
export default paymentProjectApp;
