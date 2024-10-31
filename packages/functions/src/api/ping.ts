import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import {z} from "zod";
import {withHandler} from "@/utils"
import { RouteConfig } from "@asteasolutions/zod-to-openapi";

const getResponseSchema = z.literal("pong");

export const doc : RouteConfig = 
   {
        method: 'get',
        path: '/ping',
        description: 'This endpoint plays ping pong',
        responses: {
          200: {
            description: 'Pong',
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

export const get: APIGatewayProxyHandlerV2 = withHandler(async (_event,ctx) => {
    return {
        statusCode: 200,
        body: "pong",
    };
},{
  responseSchema: getResponseSchema
});
