import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { extendZodWithOpenApi,OpenApiGeneratorV3,OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { API_VERSION } from "@normietech/core/config/index";
import { parseValidDomain, withHandler } from "@/utils";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const getResponseSchema = z.object({ version: z.string() }).openapi({
  example: { version: "1.0.0" },
});

const pingDoc : RouteConfig = 
   {
        method: 'get',
        path: '/ping',
        description: 'This endpoint plays ping pong',
        responses: {
          200: {
            description: 'Pong',
            content: {
              'application/json': {
                schema: z.object({ message: z.string() }).openapi({
                  example: { message: "Pong" },
                }),
              },
            },
          },
          500: {
            description: 'Internal Server Error',
          },
        },
}

const version : RouteConfig = 
   {
        method: 'get',
        path: '/version',
        description: 'This endpoint returns the API version',
        responses: {
          200: {
            description: 'Version',
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

const routes: RouteConfig[] = [pingDoc, version];
routes.forEach(route => registry.registerPath(route));

const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiJson = generator.generateDocument({
    info:{
        title: "Normie Tech API V1",
        version: API_VERSION,
    },
    openapi:"3.0.0",
})
