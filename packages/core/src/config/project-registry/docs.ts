import { extendZodWithOpenApi, OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import { PROJECT_REGISTRY, ProjectRegistryKey, projectSchema } from ".";
import { z } from "zod";
import { transactionsAndPaymentUser, transactionSelectSchemaWithPaymentUser } from "@/database/schema";

extendZodWithOpenApi(z);

const projectIdParameter  = {
    in:'path',
    name:'projectId',
    required:true,
    description:'The project id',
    schema:{
        type:"string"
    }
} as const;

const paymentIdParameter  = {
    in:'path',
    name:'paymentId',
    required:true,
    description:'The payment id e.g 0 for stripe',
    schema:{
        type:"number"
    }
} as const
const transactionIdParameter  = {
    in:'path',
    name:'transactionId',
    required:true,
    description:'The transaction id',
    schema:{
        type:"string"
    }
} as const

const apikeyHeader = z.object({
    "x-api-key":z.string()
})
const registry = new OpenAPIRegistry();
const commonDocs : RouteConfig[] = [

    {
        method: 'get',
        path:'/v1/{projectId}/info',
        description: 'Returns the current info of the project',
        parameters:[
            projectIdParameter,
        ],
        request:{
            headers:apikeyHeader
        },
        responses:{
            200:{
                description: 'Returns the current info of the project',
                content:{
                    "application/json":{
                        schema:projectSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    },
    {
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
    }, 
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
    },
    {
        method: 'get',
        path:'/v1/{projectId}/{paymentId}/transactions/{transactionId}',
        description: 'Returns the transaction to the  project id , transaction id and payment Id',
        parameters:[
            projectIdParameter,
            transactionIdParameter,
            paymentIdParameter
        ],
        request:{
            headers:apikeyHeader,
        },
        responses:{
            200:{
                description: 'Returns transaction of project id , transaction id and payment Id',
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
    },
    {
        method: 'get',
        path:'/v1/{projectId}/{paymentId}/transactions',
        description: 'Returns all the transaction related to project id and payment id',
        parameters:[
            projectIdParameter,
            paymentIdParameter
        ],
        request:{
            headers:apikeyHeader,
        },
        responses:{
            200:{
                description: 'Returns all the transaction related to project id and payment id',
                content:{
                    "application/json":{
                        schema:z.array(transactionSelectSchemaWithPaymentUser)
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    }


]
const voiceDeckDocs : RouteConfig[] = [
    {
        method: 'post',
        path:'/v1/voice-deck/0/checkout',
        description: 'Create a checkout session for stripe in the voice deck project',
        request:{
            body:{
                required:true,
                description:'The request body of voice deck stripe checkout',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].bodySchema
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
                        schema:PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].responseSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    }
]

const viaprizeDocs : RouteConfig [] = [
    {
        method: 'post',
        path:'/v1/viaprize/0/checkout',
        description: 'Create a checkout session for stripe in the viaprize  project',
        request:{
            body:{
                required:true,
                description:'The request body of voice deck stripe checkout',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["viaprize"].routes.checkout["0"].bodySchema
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
                        schema:PROJECT_REGISTRY["viaprize"].routes.checkout["0"].responseSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    },
    {
        method: 'post',
        path:'/v1/viaprize/0/refund',
        description: 'Put in the transaction id and get the refund triggered, but refund is not triggered unless you have that much balance in your custodial wallet',
        request:{
            body:{
                required:true,
                description:'The request body of voice deck stripe checkout',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["viaprize"].routes.refund["0"].bodySchema
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
                        schema:z.object({
                            "message":z.literal(
                                "Refund initiated"
                            )
                        })
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    }
]
const noahChonLeeDocs : RouteConfig [] = [
    {
        method: 'post',
        path:'/v1/noahchonlee/0/checkout',
        description: 'Create a checkout session for stripe in the noahchonlee  project',
        request:{
            body:{
                required:true,
                description:'The request body of voice deck stripe checkout',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["noahchonlee"].routes.checkout["0"].bodySchema
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
                        schema:PROJECT_REGISTRY["viaprize"].routes.checkout["0"].responseSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    },

]
export const PROJECT_REGISTRY_DOCS_API = {
    "default":commonDocs,
    "voice-deck":voiceDeckDocs,
    "viaprize":viaprizeDocs,
    "noahchonlee":noahChonLeeDocs
    
}