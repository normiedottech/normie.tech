export * from "./index"
import { Schema, z } from "zod";
import { ChainIdSchema } from "../../wallet/types";
import { getProjectById } from "./utils";
import { db } from "@/database";

// Define the project schema
export const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    fiatActive: z.boolean().default(true),
    fiatOptions: z.number().array(),
    feePercentage: z.number().default(5),
    feeAmount: z.number().optional(),
    settlementType: z.enum(["payout","smart-contract"]).default("payout"),
});
export const paymentLinkBodySchema = z.object({

    name: z.string(),
})
export const checkoutBodySchema = z.object({
    description: z.string().optional().openapi({
        description:"This description will be shown on the checkout website"
    }),
    name: z.string().openapi({
        description:"This will be shown on the checkout page as title"
    }),
    images: z.array(z.string()).optional().openapi({
        description:"This will be shown on the checkout page as images"
    }),
    amount: z
      .number()
      .min(50, { message: "Amount must be at least 50 i.e $0.5" })
      .max(1000000, { message: "Amount must be at most 10000000 in cents i.e $100000" }).openapi({
        description:"This is the amount in cents that will be charged to the user"
      }),
    success_url: z.string().url().openapi({
        description:"This is the url that the user will be redirected to after successful payment, advice to use a custom id and use it to fetch the status of a transaction and show success page on your frontend accordingly"
    }),
    chainId: z.number().openapi({
        description:"This is the chain id of evm blockchains , if its not an evm blockchain then use 0"
    }).optional(),
    blockChainName: z.string().optional(),
    customerEmail: z.string().optional(),
    metadata:z.any(),
    extraMetadata:z.any(),
    customId: z.string().length(20).optional(),
});
  

// Define the registry schema
export const projectRegistrySchema = z.object({
    "voice-deck": projectSchema,
    "viaprize": projectSchema,
    "noahchonlee": projectSchema,
    "lectron":projectSchema,
    "sarafu":projectSchema,
}).strict();

// Infer TypeScript types from the Zod schemas
export type Project = z.infer<typeof projectSchema>;
export type ProjectRegistry = z.infer<typeof projectRegistrySchema>;
export type ProjectRegistryKey = keyof ProjectRegistry;

const orderVoiceDeckSchema = z.object({
    quoteType: z.number(),
    globalNonce: z.string(),
    orderNonce: z.string(),
    strategyId: z.number(),
    collectionType: z.number(),
    collection: z.string(),
    currency: z.string(),
    signer: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    price: z.string(),
    signature: z.string(),
    additionalParameters: z.string(),
    subsetNonce: z.number(),
    itemIds: z.array(z.string()),
    amounts: z.array(z.number()),
});
export const payoutMetadataSchema = z.object({
    payoutAddress: z.string(),
})
const checkoutSchema = z.object({
    projectId: z.string(),
    paymentId: z.string(),
    url: z.string(),
    transactionId: z.string(), 
})

// Create the registry with the const assertion
export const PROJECT_REGISTRY = {
    "voice-deck": {
        id: "voice-deck",
        name: "Voice Deck",
        url: "https://voicedeck.org",
        feePercentage:2.5,
        fiatActive: true,
        infoResponseSchema: projectSchema,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                    
                },
                "0":{
                    bodySchema:z.object({
                        ...checkoutBodySchema.shape,
                        metadata: z.object({
                            order: orderVoiceDeckSchema,
                            recipient: z.string(),
                            amount: z.number(),
                            amountApproved: z.number(),
                            chainId:ChainIdSchema
                        }),
                    }),
                    responseSchema:checkoutSchema
                }
            }
        } 
    },
    "viaprize":{
        id:"viaprize",
        name:"Viaprize",
        url:"https://viaprize.com",
        fiatActive:true,
        feePercentage:2.5,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                },
                "0":{
                    bodySchema: z.object({
                        ...checkoutBodySchema.shape,
                        metadata: z.object({
                            contractAddress: z.string(),
                            userAddress: z.string(),
                            deadline: z.number(),
                            signature: z.string(), 
                            tokenAddress: z.string(),
                            amountApproved: z.number(),
                            ethSignedMessage: z.string(),
                        }),
                    }),
                    responseSchema:checkoutSchema
                }
            },
            refund:{
                "0":{
                    bodySchema:z.object({
                        transactionId: z.string(), 
                        refundAmountInCents:z.number(),
                    })
                }
            }
        } 
    },
    "noahchonlee":{
        id:"noahchonlee",
        name:"Noah Chon Lee",
        url:"https://noahchonlee.com",
        fiatActive:true,
        feePercentage:2.5,
        feeAmount:0.3,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                },
                "0":{
                    bodySchema: z.object({
                        ...checkoutBodySchema.shape,
                        metadata: z.object({
                            payoutAddress: z.string(),
                        }),
                    }),
                    responseSchema:checkoutSchema
                }
            },  
        } 
    },
    "lectron":{
        id:"lectron",
        name:"Lectron ",
        url:"",
        fiatActive:true,
        feePercentage:2.5,
        feeAmount:0.3,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                },
                "0":{
                    bodySchema: z.object({
                        ...checkoutBodySchema.shape,
                        metadata: z.object({
                            payoutAddress: z.string(),
                        }),
                    }),
                    responseSchema:checkoutSchema
                }
            },  
        } 
    },
    "sarafu":{
        id:"sarafu",
        name:"Sarafu by Grassroots",
        url:"",
        fiatActive:true,
        feePercentage:2.5,
        feeAmount:0.3,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                },
                "0":{
                    bodySchema: z.object({
                        ...checkoutBodySchema.shape,
                        metadata: z.object({
                            poolAddress: z.string().openapi({
                                description:"This is the pool address that wants to be deposited in the pool, you can get it from safaru.network website"
                            }),
                        }),
                    }),
                    responseSchema:checkoutSchema
                }
            },  
        } 
    },
    "brainbot-gmbh":{
        id:"brainbot-gmbh",
        name:"Paddle Battle",
        url:"",
        fiatActive:true,
        feePercentage:2.5,
        feeAmount:0.3,
        routes:{
            info:{
                "default":{
                    responseSchema: projectSchema,
                }
            },
            checkout:{
                "default":{
                    bodySchema: checkoutBodySchema,
                },
                "0":{
                    bodySchema: z.object({
                        ...checkoutBodySchema.shape,
                    }),
                    responseSchema:checkoutSchema
                }
            },  
        }
    }

} as const;

export const parseProjectRegistryKey = async (key: string|undefined): Promise<ProjectRegistryKey | string> => {
    if (!key) {
        throw new Error(`Missing project key`);
    }
    const project =await  getProjectById(key);
    if(!project) throw new Error('Project not found')
    return key as ProjectRegistryKey | string;
}


