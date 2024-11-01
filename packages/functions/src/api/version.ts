import { Resource } from "sst";
import { Handler } from "aws-lambda";
import { API_VERSION,SDK_VERSION } from "@normietech/core/config/index";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { withHandler } from "@/utils";
const getResponseSchema = z.object({
    apiVersion: z.string().default(API_VERSION),
    sdkVersion: z.string().default(SDK_VERSION),
})
export const doc : RouteConfig = 
   {
        method: 'get',
        path: '/version',
        description: 'Returns the current lastest version of the API and the SDK',
        responses: {
          200: {
            description: 'Returns the current lastest version of the API and the SDK',
            content: {
              'application/json': {
                schema: getResponseSchema,
              },
            },
          },
          500: {
            description: 'Internal Server Error',
          },
        },
}
export const get: Handler = withHandler(async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
        apiVersion: API_VERSION,
        sdkVersion: SDK_VERSION,
    }),
  };
},{
  responseSchema: getResponseSchema
});
