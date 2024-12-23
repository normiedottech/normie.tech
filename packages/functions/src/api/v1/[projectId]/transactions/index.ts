import { Hono } from 'hono';
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { db } from "@normietech/core/database/index";
import { eq, and, desc } from "drizzle-orm";
import { transactions } from "@normietech/core/database/schema/index";

const transactionProjectApp = new Hono();

// Route for getting a single transaction by transaction ID
transactionProjectApp.get('/:transactionId', async (c) => {
  const projectId  = c.req.param('projectId');
  const parsedProjectId = await parseProjectRegistryKey(projectId);
  const { transactionId } = c.req.param();

  if (!projectId || !transactionId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  try {
    const metadata = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.projectId,parsedProjectId),
        eq(transactions.id, transactionId)
      ),
      with: {
        paymentUser: true
      }
    });

    return c.json(metadata || { error: "Transaction not found" }, metadata ? 200 : 404);
  } catch (error) {
    return c.json({ error: "Failed to fetch transaction metadata" }, 500);
  }
});

// Route for getting all transactions by project ID
transactionProjectApp.get('/', async (c) => {
  const projectId  = c.req.param('projectId');
  const parsedProjectId = await parseProjectRegistryKey(projectId);

  if (!projectId) {
    return c.json({ error: "Missing projectId parameter" }, 400);
  }
  
  try {
    const metadata = await db.query.transactions.findMany({
      where: eq(transactions.projectId, parsedProjectId),
      with: {
        paymentUser: true
      },
      orderBy:desc(transactions.createdAt)
    });

    return c.json(metadata, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch transactions" }, 500);
  }
});

// Export app as default for serverless framework compatibility
export default transactionProjectApp;
