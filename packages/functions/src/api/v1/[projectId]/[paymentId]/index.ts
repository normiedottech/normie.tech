import { Hono } from 'hono';
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { parsePaymentRegistryId } from "@normietech/core/config/payment-registry/index";
import { db } from "@normietech/core/database/index";
import { eq, and } from "drizzle-orm";
import { transactions } from "@normietech/core/database/schema/index";
import checkoutApp from './checkout';
import { apiKeyMiddleware } from '@/middleware/apiKey';
import refundApp from './refund';

const paymentProjectApp = new Hono();

// Route for getting a single transaction by project, payment, and transaction ID
paymentProjectApp.get('/transactions/:transactionId', async (c) => {
  const { projectId, paymentId, transactionId } = c.req.param<any>();

  if (!projectId || !paymentId || !transactionId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  try {
    const parsedPaymentId = parsePaymentRegistryId(paymentId);

    
    console.log({projectId, parsedPaymentId, transactionId})
    const metadata = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.projectId, parseProjectRegistryKey(projectId)),
        eq(transactions.paymentId, parsedPaymentId),
        eq(transactions.id, transactionId)
      ),
      with: {
        paymentUser: true
      }
    });
    console.log({metadata})
    return c.json(metadata || { error: "Transaction not found" }, metadata ? 200 : 404);
  } catch (error) {
    return c.json({ error: "Failed to fetch transaction metadata" }, 500);
  }
});

// Route for getting all transactions by project and payment ID
paymentProjectApp.get('/transactions', async (c) => {
  const { projectId, paymentId } = c.req.param<any>();

  if (!projectId || !paymentId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  try {
    const parsedPaymentId = parsePaymentRegistryId(paymentId);

    const metadata = await db.query.transactions.findMany({
      where: and(
        eq(transactions.projectId, parseProjectRegistryKey(projectId)),
        eq(transactions.paymentId, parsedPaymentId)
      ),
      with: {
        paymentUser: true
      }
    });

    return c.json(metadata, 200);
  } catch (error) {
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }
});
paymentProjectApp.use("/checkout",apiKeyMiddleware)
paymentProjectApp.route("/checkout", checkoutApp);
paymentProjectApp.use("/refund",apiKeyMiddleware)
paymentProjectApp.route("/refund", refundApp);
// Export app as default for serverless framework compatibility
export default paymentProjectApp;
