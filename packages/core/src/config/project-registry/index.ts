export * from "./index"
import { Schema, z } from "zod";
import { ChainIdSchema } from "../../wallet/types";

// Define the project schema
export const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    fiatActive: z.boolean().default(true),
    fiatOptions: z.number().array(),
    feePercentage: z.number().default(5),
    feeAmount: z.number().optional(),
});

export const checkoutBodySchema = z.object({
    description: z.string().optional(),
    name: z.string(),
    images: z.array(z.string()).optional(),
    amount: z
      .number()
      .min(50, { message: "Amount must be at least 50 i.e $0.5" })
      .max(1000000, { message: "Amount must be at most 10000000 in cents i.e $100000" }),
    success_url: z.string().url(),
    chainId: z.number(),
    blockChainName: z.string().optional().default("evm"),
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
        feePercentage:5,
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
        feePercentage:5,
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
        feePercentage:5,
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
        name:"Noah Chon Lee",
        url:"",
        fiatActive:true,
        feePercentage:5,
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
    }

} as const;

export const parseProjectRegistryKey = (key: string|undefined): ProjectRegistryKey => {
    if (!key) {
        throw new Error(`Missing project key`);
    }
    if (!(key in PROJECT_REGISTRY)) {
        throw new Error(`Unknown project key: ${key}`);
    }
    return key as ProjectRegistryKey;
}


