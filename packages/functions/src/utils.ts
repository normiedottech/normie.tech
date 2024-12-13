
import { z } from "zod";
import { fromError } from 'zod-validation-error';

type ErrorResponse = {
    statusCode: number;
    body: string; // JSON stringified
   
  };
  import { ZodError, ZodSchema } from 'zod';
import { Context } from "hono";
import { Resource } from "sst";
  
  type Handler = (
    c: Context
  ) => Promise<Response>;
 
const createErrorResponse = (status: number, title: string, detail?: string): Response => {
    return new Response(
      JSON.stringify({
        status,
        title,
        detail,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };
  
  export const withHandler = (
    handler: Handler,
    schema?: {
      bodySchema?: ZodSchema<any>,
      responseSchema?: ZodSchema<any>
    }
  ): Handler => async (c) => {
    try {
      // Validate body if schema is provided
      if (schema?.bodySchema) {
        const parsedBody = await c.req.json();
        schema.bodySchema.parse(parsedBody);
      }
  
      // Execute the handler
      const result = await handler(c);
  
      // Validate response if schema is provided
      if (schema?.responseSchema) {
        const responseBody = await result.json();
        schema.responseSchema.parse(responseBody);
      }
  
      return result;
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        const validationError = fromError(error);
     
        return createErrorResponse(400, validationError.name, validationError.message);
      }
      if (error instanceof Error) {
        return createErrorResponse(500, "Internal Server Error", error.message);
      }
      return createErrorResponse(500, "Internal Server Error");
    }
  };
  

export const parseValidDomain = (domain: string,stage?:string) => {
  if(domain.includes("v1.amazonaws.com")){
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



export const metadataStripeSchema = z.object({
    metadataId: z.string().optional(),
    projectId: z.string(),
    paymentType: z.enum(['paymentLink', 'checkout']).default(
      'checkout'
    ),
    stage: z.string().default(Resource.App.stage)
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