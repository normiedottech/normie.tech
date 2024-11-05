import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2, Callback, Context } from "aws-lambda";
import { z, ZodError, ZodSchema } from "zod";
import { fromError } from 'zod-validation-error';

type ErrorResponse = {
    statusCode: number;
    body: string; // JSON stringified
   
  };

export const parseValidDomain = (domain: string,stage?:string) => {
  if(domain.includes("amazonaws.com")){
    return `https://${domain}/${stage || "production"}`;
  }
  return `https://${domain}`
}
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

export const getDocumentationHTML = (url: string) => {
  return `<!DOCTYPE html>

<html lang="en">

  <head>

    <meta charset="utf-8" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta name="description" content="SwaggerUI" />

    <title>SwaggerUI</title>

    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />

  </head>

  <body>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" crossorigin></script>

  <script>

    window.onload = () => {

      window.ui = SwaggerUIBundle({

        url: '${url}',

        dom_id: '#swagger-ui',

        presets: [

          SwaggerUIBundle.presets.apis,

          SwaggerUIStandalonePreset

        ],

        layout: "StandaloneLayout",

      });

    };

  </script>

  </body>

</html>`
}