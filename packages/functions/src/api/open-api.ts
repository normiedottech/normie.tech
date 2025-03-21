import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { extendZodWithOpenApi,OpenApiGeneratorV3,OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { API_VERSION } from "@normietech/core/config/index";
import { parseValidDomain, withHandler } from "@/utils";
import { apikeyHeader, projectIdParameter, transactionIdParameter } from "@normietech/core/config/project-registry/docs";
import { transactionSelectSchemaWithPaymentUser } from "@normietech/core/database/schema/index";
import { checkoutBodySchema, checkoutBodySchemaMinimal, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";

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
const fetchTransactions : RouteConfig =   {
  method: 'get',
  path:'/v1/{projectId}/transactions',
  description: 'Returns the list of transactions of related to the  project id',
  parameters:[
      projectIdParameter,
  ],
  request:{
      headers:apikeyHeader,
  },
  responses:{
      200:{
          
          description: 'Returns the list of transactions of related to the  project id',
          content:{
              "application/json":{
                  schema:z.array(transactionSelectSchemaWithPaymentUser)
              }
          }
      }
  }
}
const fetchTransaction : RouteConfig = 
  {
    method: 'get',
    path:'/v1/{projectId}/transactions/{transactionId}',
    description: 'Returns the transaction to the  project id and transaction id',
    parameters:[
        projectIdParameter,
        transactionIdParameter,
    ],
    request:{
        headers:apikeyHeader,
    },
    responses:{
        200:{
            description: 'Returns transaction of project id and transaction id',
            content:{
                "application/json":{
                    schema:transactionSelectSchemaWithPaymentUser
                }
            }
        },
        500:{
            description: 'Internal Server Error'
        }
    }
  }


const createCheckout: RouteConfig = 
  {
    method: 'post',
    path:'/v1/{projectId}/0/checkout',
    description: 'Create a checkout session  link',
    parameters:[
      projectIdParameter,
    ],
    request:{
        body:{
            required:true,
            description:'The request body checkout',
            content:{
                "application/json":{
                    schema:checkoutBodySchemaMinimal
                }
            }
        },
        headers: apikeyHeader
    },
    responses:{
        200:{
            description: 'Returns the checkout session',
            content:{
                "application/json":{
                    schema:PROJECT_REGISTRY["brainbot-gmbh"].routes.checkout["0"].responseSchema
                }
            }
        },
        500:{
            description: 'Internal Server Error'
        }
    }
}

const routes: RouteConfig[] = [pingDoc, version,fetchTransactions,fetchTransaction,createCheckout];
routes.forEach(route => registry.registerPath(route));

const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiJson = generator.generateDocument({
    info:{
        title: "Normie Tech API V1",
        version: API_VERSION,
    },
    openapi:"3.0.0",
})
