import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { eq, and } from "drizzle-orm";
import { transactions, transactionSelectSchemaWithPaymentUser } from "@normietech/core/database/schema/index";
export const get: APIGatewayProxyHandlerV2 = withHandler(
  async (_event, ctx) => {
    if (!_event.pathParameters) {
      throw new Error("Missing path parameters");
    }
    const transactionId = _event.pathParameters.transactionId;
    if (!transactionId) {
      throw new Error("Missing transactionId");
    }
    const metadata = await db.query.transactions.findMany({
      where: and(
        eq(
          transactions.projectId,
          parseProjectRegistryKey(_event.pathParameters.projectId)
        )
      ),
      with:{
        paymentUser:true
      }
    });
    return {
      statusCode: 200,
      body: JSON.stringify(metadata),
    };
  },{
    responseSchema: transactionSelectSchemaWithPaymentUser.array()
  }
);