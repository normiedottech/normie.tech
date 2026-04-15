import { extendZodWithOpenApi, OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import { paymentLinkBodySchema, PROJECT_REGISTRY, ProjectRegistryKey, projectSchema } from ".";
import { z } from "zod";
import { plansInsertSchema, plansSelectSchema, transactionSelectSchemaWithPaymentUser } from "@/database/schema";

extendZodWithOpenApi(z);

export const projectIdParameter = {
  in: 'path',
  name: 'projectId',
  required: true,
  description: 'The project id',
  schema: {
    type: "string"
  }
} as const;
export const transactionIdParameter = {
  in: 'path',
  name: 'transactionId',
  required: true,
  description: 'The transaction id',
  schema: {
    type: "string"
  }
} as const

const productBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const planBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  interval: z.enum(['day', 'week', 'month', 'year']).default('month'),
  intervalCount: z.number().int().positive().default(1),
  metadata: z.record(z.any()).optional(),
})

export const createPlanSchema = z.object({
  projectId: z.string(),
  product: productBodySchema.optional(),
  productId: z.string().optional(),
  plan: planBodySchema,
})

export const apikeyHeader = z.object({
  "x-api-key": z.string()
})
const registry = new OpenAPIRegistry();
const commonDocs: RouteConfig[] = [

  {
    method: 'get',
    path: '/v1/{projectId}/info',
    description: 'Returns the current info of the project',
    parameters: [
      projectIdParameter,
    ],
    request: {
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the current info of the project',
        content: {
          "application/json": {
            schema: projectSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  },
  {
    method: 'get',
    path: '/v1/{projectId}/transactions',
    description: 'Returns the list of transactions of related to the  project id',
    parameters: [
      projectIdParameter,
      {
        in: "query",
        name: "page",
        description: "Page number",
        schema: {
          type: "integer",
          default: 1
        }
      },
      {
        in: "query",
        name: "limit",
        description: "Number of items per page",
        schema: {
          type: "integer",
          default: 50
        }
      }
    ],
    request: {
      headers: apikeyHeader,
    },
    responses: {
      200: {

        description: 'Returns the list of transactions of related to the  project id',
        content: {
          "application/json": {
            schema: z.array(transactionSelectSchemaWithPaymentUser)
          }
        }
      }
    }
  },
  {
    method: 'get',
    path: '/v1/{projectId}/transactions/{transactionId}',
    description: 'Returns the transaction to the  project id and transaction id',
    parameters: [
      projectIdParameter,
      transactionIdParameter,
    ],

    request: {
      headers: apikeyHeader,
    },
    responses: {
      200: {
        description: 'Returns transaction of project id and transaction id',
        content: {
          "application/json": {
            schema: transactionSelectSchemaWithPaymentUser
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  },
  {
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
            schema: createPlanSchema
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
                  email: z.string(),
                }),
                product: z.object({
                  id: z.string(),
                  name: z.string(),
                }),
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
  },
  {
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
            schema: z.object({
              planId: z.string().describe("The ID of the plan to subscribe to")
            })
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
  },
  {
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
  }
]
const voiceDeckDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/voice-deck/0/checkout',
    description: 'Create a checkout session for stripe in the voice deck project',
    request: {
      body: {
        required: true,
        description: 'The request body of voice deck stripe checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]

const viaprizeDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/viaprize/0/checkout',
    description: 'Create a checkout session for stripe in the viaprize  project',
    request: {
      body: {
        required: true,
        description: 'The request body of voice deck stripe checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["viaprize"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["viaprize"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  },
  {
    method: 'post',
    path: '/v1/viaprize/0/refund',
    description: 'Put in the transaction id and get the refund triggered, but refund is not triggered unless you have that much balance in your custodial wallet',
    request: {
      body: {
        required: true,
        description: 'The request body of voice deck stripe checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["viaprize"].routes.refund["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: z.object({
              "message": z.literal(
                "Refund initiated"
              )
            })
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]
const noahChonLeeDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/noahchonlee/0/checkout',
    description: 'Create a checkout session for stripe in the noahchonlee  project',
    request: {
      body: {
        required: true,
        description: 'The request body of voice deck stripe checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["noahchonlee"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["viaprize"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  },

]

export const sarafuDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/sarafu/0/checkout',
    description: 'Create a checkout session  link for stripe in the safaru  project',
    request: {
      body: {
        required: true,
        description: 'The request body of sarafu square up checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["sarafu"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["sarafu"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]

export const brainBotDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/{projectId}/0/payment-links',
    description: 'Returns all the transaction related to project id and payment id',
    parameters: [
      projectIdParameter,
    ],
    request: {
      headers: apikeyHeader,
      body: {
        required: true,
        description: "The request body of the payment link",
        content: {
          "application/json": {
            schema: paymentLinkBodySchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Returns URL of the payment link',
        content: {
          "application/json": {
            schema: z.object({ url: z.string() })
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  },
  {
    method: 'post',
    path: '/v1/brainbot-gmbh/0/checkout',
    description: 'Create a checkout session  link for brain bot',
    request: {
      body: {
        required: true,
        description: 'The request body of brain bot square up checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["brainbot-gmbh"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["brainbot-gmbh"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]

export const thirdPayDocs: RouteConfig[] = [

  {
    method: 'post',
    path: '/v1/thirdpay/0/checkout',
    description: 'Create a checkout session  link for brain bot',
    request: {
      body: {
        required: true,
        description: 'The request body of brain bot square up checkout',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["noahchonlee"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["noahchonlee"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]
export const megapotDocs: RouteConfig[] = [
  {
    method: 'post',
    path: '/v1/megapot/0/checkout',
    description: 'Create a checkout session  link',
    request: {
      body: {
        required: true,
        description: 'The request body of megapott',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["megapot"].routes.checkout["0"].bodySchema
          }
        }
      },
      headers: apikeyHeader
    },
    responses: {
      200: {
        description: 'Returns the checkout session',
        content: {
          "application/json": {
            schema: PROJECT_REGISTRY["megapot"].routes.checkout["0"].responseSchema
          }
        }
      },
      500: {
        description: 'Internal Server Error'
      }
    }
  }
]
export const PROJECT_REGISTRY_DOCS_API = {
  "default": commonDocs,
  "voice-deck": voiceDeckDocs,
  "viaprize": viaprizeDocs,
  "noahchonlee": noahChonLeeDocs,
  "sarafu": sarafuDocs,
  "brainbot-gmbh": brainBotDocs,
  "thirdpay": thirdPayDocs,
  "megapot": megapotDocs
}
