import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2, Callback, Context } from "aws-lambda";
import { ZodError } from "zod";
import { fromError } from 'zod-validation-error';

type ErrorResponse = {
    statusCode: number;
    body: string; // JSON stringified
   
  };
export const assertNotNull = (asset: any, message: string) => {
    if (!asset) {
        throw new Error(message);
    }
    return asset;

}

export const createErrorResponse = (statusCode: number, message: string, details?: string): ErrorResponse => ({
    statusCode,
    body: JSON.stringify({
      error: {
        message,
        details,
      },
    })
  });

  export const withErrorHandling = (
    handler: (event: APIGatewayProxyEventV2, ctx: Context, callback: Callback<APIGatewayProxyResultV2<never>>) => Promise<APIGatewayProxyResultV2>
  ): APIGatewayProxyHandlerV2 => async (event, ctx, callback) => {
    try {
      return await handler(event, ctx, callback);
    } catch (error) {
      console.error(error);
      if(error instanceof ZodError){
        const validationError = fromError(error);
        return createErrorResponse(400, "Bad Request", validationError.message);
      }
      if (error instanceof Error) {
        return createErrorResponse(500, "Internal Server Error", error.message);
      }
      return createErrorResponse(500, "Internal Server Error");
    }
  };