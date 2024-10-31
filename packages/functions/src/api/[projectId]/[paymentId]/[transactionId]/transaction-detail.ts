import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import {
  PROJECT_REGISTRY,
  ProjectRegistryKey,
} from "@normietech/core/project-registry/index";
import { parseProjectRegistryKey } from "@normietech/core/project-registry/index";
import { withErrorHandling } from "@/utils";
import { db } from "@normietech/core/database/index";
import { eq, and } from "drizzle-orm";
import { transactions } from "@normietech/core/database/schema/index";
import { parsePaymentRegistryId } from "@normietech/core/payment-registry/index";
export const handler: APIGatewayProxyHandlerV2 = withErrorHandling(
  async (_event, ctx) => {
    if (!_event.pathParameters) {
      throw new Error("Missing path parameters");
    }
    const transactionId = _event.pathParameters.transactionId;
    if (!transactionId) {
      throw new Error("Missing transactionId");
    }
    const paymentId = parsePaymentRegistryId(_event.pathParameters.paymentId);

    const metadata = await db.query.transactions.findFirst({
      where: and(
        eq(
          transactions.projectId,
          parseProjectRegistryKey(_event.pathParameters.projectId)
        ),
        eq(transactions.paymentId, paymentId),
        eq(transactions.id, transactionId)
      ),
      with:{
        paymentUser:true
      }
    });
    return {
      statusCode: 200,
      body: JSON.stringify(metadata),
    };
  }
);
