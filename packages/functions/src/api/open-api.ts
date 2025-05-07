import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { extendZodWithOpenApi,OpenApiGeneratorV3,OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { API_VERSION } from "@normietech/core/config/index";
import { parseValidDomain, withHandler } from "@/utils";
import { apikeyHeader, projectIdParameter, transactionIdParameter } from "@normietech/core/config/project-registry/docs";
import { transactionSelectSchemaWithPaymentUser, plansSelectSchema } from "@normietech/core/database/schema/index";
import { checkoutBodySchema, checkoutBodySchemaMinimal, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";
import { createPlanBodySchema, productBodySchema, planBodySchema } from "./v1/[projectId]/[paymentId]/plan";
import { subscriptionBodySchema } from "./v1/[projectId]/[paymentId]/subscription";

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

const createPlan: RouteConfig = {
    method: 'post',
    path: '/v1/{projectId}/0/plan',
    description: 'Create a new subscription plan for the project. A plan defines the pricing and billing cycle for a subscription.',
    parameters: [
        projectIdParameter,
    ],
    request: {
        headers: apikeyHeader,
        body: {
            required: true,
            description: 'The request body for creating a subscription plan',
            content: {
                "application/json": {
                    schema: createPlanBodySchema
                }
            }
        }
    },
    responses: {
        201: {
            description: 'Plan created successfully',
            content: {
                "application/json": {
                    schema: plansSelectSchema
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid input or missing required fields'
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Project or product not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const getAllPlans: RouteConfig = {
    method: 'get',
    path: '/v1/{projectId}/0/plan',
    description: 'Get all subscription plans for the project',
    parameters: [
        projectIdParameter,
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'List of plans retrieved successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        plans: z.array(plansSelectSchema)
                    })
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const getPlan: RouteConfig = {
    method: 'get',
    path: '/v1/{projectId}/0/plan/{planId}',
    description: 'Get a specific subscription plan by ID',
    parameters: [
        projectIdParameter,
        {
            name: 'planId',
            in: 'path',
            required: true,
            description: 'The ID of the plan to retrieve',
            schema: {
                type: 'string'
            }
        }
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'Plan retrieved successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        plan: plansSelectSchema
                    })
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Plan not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const deletePlan: RouteConfig = {
    method: 'delete',
    path: '/v1/{projectId}/0/plan/{planId}',
    description: 'Delete a subscription plan',
    parameters: [
        projectIdParameter,
        {
            name: 'planId',
            in: 'path',
            required: true,
            description: 'The ID of the plan to delete',
            schema: {
                type: 'string'
            }
        }
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'Plan deleted successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Plan not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const getAllSubscriptions: RouteConfig = {
    method: 'get',
    path: '/v1/{projectId}/0/subscription',
    description: 'Get all subscriptions for the project',
    parameters: [
        projectIdParameter,
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'List of subscriptions retrieved successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        subscriptions: z.array(z.object({
                            id: z.string(),
                            status: z.string(),
                            currentPeriodStart: z.string(),
                            currentPeriodEnd: z.string().nullable(),
                            cancelAtPeriodEnd: z.boolean(),
                            paymentUser: z.object({
                                id: z.string(),
                                email: z.string(),
                            }),
                            product: z.object({
                                id: z.string(),
                                name: z.string(),
                            }),
                        }))
                    })
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const getSubscription: RouteConfig = {
    method: 'get',
    path: '/v1/{projectId}/0/subscription/{subscriptionId}',
    description: 'Get a specific subscription by ID',
    parameters: [
        projectIdParameter,
        {
            name: 'subscriptionId',
            in: 'path',
            required: true,
            description: 'The ID of the subscription to retrieve',
            schema: {
                type: 'string'
            }
        }
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'Subscription retrieved successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        subscription: z.object({
                            id: z.string(),
                            status: z.string(),
                            currentPeriodStart: z.string(),
                            currentPeriodEnd: z.string().nullable(),
                            cancelAtPeriodEnd: z.boolean(),
                            paymentUser: z.object({
                                id: z.string(),
                                email: z.string()
                            }),
                            product: z.object({
                                id: z.string(),
                                name: z.string()
                            })
                        })
                    })
                }
            }
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Subscription not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const createSubscription: RouteConfig = {
    method: 'post',
    path: '/v1/{projectId}/0/subscription',
    description: 'Create a new subscription',
    parameters: [
        projectIdParameter,
    ],
    request: {
        headers: apikeyHeader,
        body: {
            required: true,
            description: 'The request body for creating a subscription',
            content: {
                "application/json": {
                    schema: subscriptionBodySchema
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Subscription created successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        subscription: z.object({
                            id: z.string(),
                            status: z.string(),
                            currentPeriodStart: z.string(),
                            externalSubscriptionId: z.string(),
                            links: z.array(z.object({
                                href: z.string(),
                                rel: z.string(),
                                method: z.string(),
                            }))
                        })
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid input or missing required fields'
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Plan not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const cancelSubscription: RouteConfig = {
    method: 'post',
    path: '/v1/{projectId}/0/subscription/{subscriptionId}/cancel',
    description: 'Cancel a subscription',
    parameters: [
        projectIdParameter,
        {
            name: 'subscriptionId',
            in: 'path',
            required: true,
            description: 'The ID of the subscription to cancel',
            schema: {
                type: 'string'
            }
        }
    ],
    request: {
        headers: apikeyHeader,
    },
    responses: {
        200: {
            description: 'Subscription cancelled successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean()
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Subscription is not active'
        },
        401: {
            description: 'Unauthorized - Invalid API key'
        },
        404: {
            description: 'Not Found - Subscription not found'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const routes: RouteConfig[] = [
    pingDoc, 
    version,
    fetchTransactions,
    fetchTransaction,
    createCheckout,
    createPlan,
    getAllPlans,
    getPlan,
    deletePlan,
    getAllSubscriptions,
    getSubscription,
    createSubscription,
    cancelSubscription
];
routes.forEach(route => registry.registerPath(route));

const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiJson = generator.generateDocument({
    info:{
        title: "Normie Tech API V1",
        version: API_VERSION,
    },
    openapi:"3.0.0",
})
