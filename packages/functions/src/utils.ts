import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2, Callback, Context } from "aws-lambda";
import { z, ZodError, ZodSchema } from "zod";
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



export const withHandler = (
  handler: (
    event: APIGatewayProxyEventV2,
    ctx: Context,
    callback: Callback<APIGatewayProxyResultV2<never>>
  ) => Promise<APIGatewayProxyResultV2>,
  schema?:{
    bodySchema?: ZodSchema<any>,
    responseSchema?: ZodSchema<any>
  }
): APIGatewayProxyHandlerV2 => async (event, ctx, callback) => {
  try {
    // Validate body if schema is provided
    if (schema?.bodySchema) {
      const parsedBody = JSON.parse(event.body || "{}");
      schema.bodySchema.parse(parsedBody);
    }

    // Execute the handler
    const result :any = await handler(event, ctx, callback);
    if(!result?.body){
      throw new Error("Response body must be given");
    }
    if (typeof result.body !== "string") {
      throw new Error("Response body must be a string");
    }
  
    // Validate response if schema is provided
    if (schema?.responseSchema) {
      schema.responseSchema.parse(JSON.parse(result.body));
    }

    

    return result;
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      const validationError = error.errors.map((err) => err.message).join(", ");
      return createErrorResponse(400, "Bad Request", validationError);
    }
    if (error instanceof Error) {
      return createErrorResponse(500, "Internal Server Error", error.message);
    }
    return createErrorResponse(500, "Internal Server Error");
  }
};

export const metadataStripeSchema = z.object({
    metadataId: z.string().optional(),
    projectId: z.string(),
})