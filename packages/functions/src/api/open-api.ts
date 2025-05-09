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
const zelleRegistry = new OpenAPIRegistry();

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

const createCheckoutWithPayoutAddress: RouteConfig = 
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
                    schema:z.object({
                        ...checkoutBodySchemaMinimal.shape,
                        metadata: z.object({
                            payoutAddress: z.string(),
                        }),
                        success_url:z.string().optional()
                    })
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
                    schema: z.object({
                        success: z.boolean(),
                        plan: plansSelectSchema,
                        subscriptionUrl: z.string().describe('URL for subscribing to this plan')
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

const zelleConfirmRoute: RouteConfig = {
    method: 'post',
    path: '/v1/payment/5/capture/confirm',
    description: 'Confirm a Zelle Phoenix payment transaction',
    request: {
        body: {
            required: true,
            description: 'The request body for confirming a Zelle payment',
            content: {
                "application/json": {
                    schema: z.object({
                        transactionId: z.string().min(1, "Transaction ID is required")
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Payment confirmed successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        verified: z.boolean()
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid input or transaction already confirmed',
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string(),
                        message: z.string().optional(),
                        isVerified: z.boolean().optional()
                    })
                }
            }
        },
        404: {
            description: 'Not Found - Transaction not found',
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const zelleSettleRoute: RouteConfig = {
    method: 'post',
    path: '/v1/payment/5/capture/settle',
    description: 'Settle a confirmed Zelle Phoenix payment transaction',
    request: {
        body: {
            required: true,
            description: 'The request body for settling a Zelle payment',
            content: {
                "application/json": {
                    schema: z.object({
                        transactionId: z.string().min(1, "Transaction ID is required")
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Payment settled successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        transaction: transactionSelectSchemaWithPaymentUser
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid input or transaction not locked',
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Not Found - Transaction not found',
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const zelleGetDetailsRoute: RouteConfig = {
    method: 'get',
    path: '/v1/payment/5/details/{transactionId}',
    description: 'Get Zelle payment details for a transaction',
    parameters: [
        {
            name: 'transactionId',
            in: 'path',
            required: true,
            description: 'The ID of the transaction to get details for',
            schema: {
                type: 'string'
            }
        }
    ],
    responses: {
        200: {
            description: 'Payment details retrieved successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            transactionId: z.string(),
                            confirmationStatus: z.string(),
                            payoutDetails: z.string().optional(),
                            amount: z.number().optional(),
                            uniquenessAmount: z.number().optional()
                        })
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid transaction ID',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        error: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Not Found - Payment details not found',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        error: z.string()
                    })
                }
            }
        },
        500: {
            description: 'Internal Server Error'
        }
    }
};

const zelleUpdateDetailsRoute: RouteConfig = {
    method: 'post',
    path: '/v1/payment/5/details',
    description: 'Update Zelle payment details for a transaction',
    request: {
        body: {
            required: true,
            description: 'The request body for updating Zelle payment details',
            content: {
                "application/json": {
                    schema: z.object({
                        transactionId: z.string().min(1, "Transaction ID is required")
                    })
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Payment details updated successfully',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            orderId: z.string(),
                            status: z.string(),
                            amount: z.string(),
                            recipientAddress: z.string(),
                            createdAt: z.string(),
                            verificationMethod: z.string(),
                            orderFulfillment: z.any().optional(),
                            orderVerification: z.any().optional()
                        })
                    })
                }
            }
        },
        400: {
            description: 'Bad Request - Invalid input or transaction already confirmed',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        error: z.string()
                    })
                }
            }
        },
        404: {
            description: 'Not Found - Transaction or payment details not found',
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean(),
                        error: z.string()
                    })
                }
            }
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
    cancelSubscription,
    zelleConfirmRoute,
    zelleSettleRoute,
    zelleGetDetailsRoute,
    zelleUpdateDetailsRoute
];

const zelleOpenApiRoutes: RouteConfig[] = [
    pingDoc, 
    version,
    createCheckoutWithPayoutAddress,
    fetchTransactions,
    fetchTransaction,
    zelleConfirmRoute,
    zelleSettleRoute,
    zelleGetDetailsRoute,
    zelleUpdateDetailsRoute
]
routes.forEach(route => registry.registerPath(route));
zelleOpenApiRoutes.forEach(route => zelleRegistry.registerPath(route));
const generator = new OpenApiGeneratorV3(registry.definitions);
const zelleGenerator = new OpenApiGeneratorV3(zelleRegistry.definitions);
export const openApiJson = generator.generateDocument({
    info:{
        title: "Normie Tech API V1",
        version: API_VERSION,
    },
    openapi:"3.0.0",
})

export const zelleOpenApiJson = zelleGenerator.generateDocument({
    info:{
        title: "Zelle API",
        version: API_VERSION,
    },
    openapi:"3.0.0",
})
