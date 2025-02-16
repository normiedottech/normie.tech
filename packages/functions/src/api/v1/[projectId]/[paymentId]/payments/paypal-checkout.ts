import { ApiError, CheckoutPaymentIntent, Client, Environment, LogLevel, Order, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk'
import { checkoutBodySchema, paymentLinkBodySchema, payoutMetadataSchema, PROJECT_REGISTRY, ProjectRegistryKey } from '@normietech/core/config/project-registry/index'
import { getProjectById, getPayoutSettings } from "@normietech/core/config/project-registry/utils";
import { z } from "zod";
import { Resource } from 'sst';
import { products, projects, transactions } from "@normietech/core/database/schema/index";
import { SARAFU_CUSD_TOKEN } from "@normietech/core/sarafu/index";
import { USD_TOKEN_ADDRESSES, blockchainNamesSchema } from "@normietech/core/wallet/types";
import { erc20Abi } from "viem";
import { evmClient, getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { eq } from 'drizzle-orm';
import { db } from '@normietech/core/database/index';
import { nanoid } from 'nanoid';



export const paypalClient = new Client({

    clientCredentialsAuthCredentials: {

        oAuthClientId: Resource.PAYPAL_CLIENT_ID.value, 

        oAuthClientSecret: Resource.PAYPAL_SECRET.value

    },

    timeout: 0,

    environment:  Resource.App.stage === "production" ? Environment.Production : Environment.Sandbox,

    logging: {

        logLevel: LogLevel.Info,

      

    },

}); 




export const ordersController = new OrdersController(paypalClient);

export const paymentsController = new PaymentsController(paypalClient)

export const paypalCheckout = async (
    body: z.infer<typeof checkoutBodySchema>,
    projectId: ProjectRegistryKey | string,
    transaction: typeof transactions.$inferInsert | undefined,
    metadataId: string,
    productId: string | undefined
  ) => {
    let newTransaction = { ...transaction };
  
    newTransaction = {
      ...transaction,
      chainId: body.chainId,
      currencyInFiat: "USD",
      amountInFiat: body.amount / 100,
    };
  
    switch (projectId) {
      case "voice-deck": {
        const metadata =
          PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(
            body
          ).metadata;
        const decimals = await evmClient(metadata.chainId).readContract({
          abi: erc20Abi,
          functionName: "decimals",
          address: metadata.order.currency as `0x${string}`,
        });
  
        newTransaction = {
          ...newTransaction,
          chainId: body.chainId,
          metadataJson: JSON.stringify(metadata),
          token: metadata.order.currency,
          amountInToken: metadata.amountApproved,
          decimals: decimals,
        };
        break;
      }
      case "sarafu":{
        const metadata = PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(body).metadata;
        const decimals = await evmClient(body.chainId).readContract({
          abi: erc20Abi,
          functionName: "decimals",
          address: SARAFU_CUSD_TOKEN as `0x${string}`,
        });
        const finalAmountInToken = (body.amount / 100) * 10 ** decimals;
        newTransaction = {
          ...newTransaction,
          metadataJson: JSON.stringify(metadata),
          token: SARAFU_CUSD_TOKEN,
          amountInToken: finalAmountInToken,
          decimals: decimals,
        };
        break;
      }
      case "viaprize": {
        const metadata =
          PROJECT_REGISTRY["viaprize"].routes.checkout[0].bodySchema.parse(
            body
          ).metadata;
        const decimals = await evmClient(body.chainId).readContract({
          abi: erc20Abi,
          functionName: "decimals",
          address: metadata.tokenAddress as `0x${string}`,
        });
        newTransaction = {
          ...newTransaction,
          metadataJson: JSON.stringify(metadata),
          token: metadata.tokenAddress,
          amountInToken: metadata.amountApproved,
          decimals: decimals,
        };
        
        break;
      }
      case "noahchonlee": {
        const project = PROJECT_REGISTRY["noahchonlee"];
        const metadata =
          project.routes.checkout[0].bodySchema.parse(body).metadata;
        const decimals = await evmClient(body.chainId).readContract({
          abi: erc20Abi,
          functionName: "decimals",
          address: USD_TOKEN_ADDRESSES["optimism"] as `0x${string}`,
        });
        const finalAmountInToken = body.amount * 10 ** decimals;
        newTransaction = {
          ...newTransaction,
          metadataJson: JSON.stringify(metadata),
          token: USD_TOKEN_ADDRESSES["optimism"],
          amountInToken: finalAmountInToken,
          decimals: decimals,
        };
        break;
      }
      default: {
        const project = (await getProjectById(
          projectId
        )) as typeof projects.$inferSelect;
        if (project.settlementType === "smart-contract") {
          throw new Error("Smart contract settlement not supported");
        }
        
        const payoutSetting = await getPayoutSettings(projectId);
        const token = USD_TOKEN_ADDRESSES[blockchainNamesSchema.parse(payoutSetting.blockchain)];
  
        const metadata = payoutMetadataSchema.parse(body.metadata);
        const decimals = await getDecimalsOfToken(payoutSetting.blockchain, token, payoutSetting.chainId);
        
        const finalAmountInToken = body.amount * 10 ** decimals;
        newTransaction = {
          ...newTransaction,
          metadataJson: JSON.stringify(metadata),
          token: token,
          amountInToken: finalAmountInToken,
          decimals: decimals,
        };
      }
    }
    const finalProducts = {
        id: nanoid(14),
        name: body.name,
        description: body.description,
        priceInFiat: body.amount / 100,
        projectId: projectId,
    } as typeof products.$inferSelect;

    newTransaction = {
        ...newTransaction,
        productId: productId || finalProducts.id ,
    }
    try {
       if(!newTransaction.amountInFiat){
        throw new Error("Amount in fiat is required");
       }

        const { result } = await ordersController.ordersCreate(

            {
                body:{
                    intent:CheckoutPaymentIntent.Capture,
                    
                    purchaseUnits:[
                        {
                            customId:metadataId,
                            amount:{
                                currencyCode:"USD",
                                value:newTransaction.amountInFiat.toString(),
                                breakdown:{
                                  itemTotal:{
                                    currencyCode:"USD",
                                    value:newTransaction.amountInFiat.toString()
                                  }
                                } 
                            },
                            description:body.description,
                            items:[{
                                name:body.name,
                                unitAmount:{
                                    currencyCode:"USD",
                                    value:newTransaction.amountInFiat.toString()
                                },
                                description:body.description,
                                imageUrl:body?.images?.at(0),
                                quantity:"1"
                            }]
                        }
                    ],
                    
                    applicationContext:{
                        returnUrl:body.success_url,
                    
                    }
                },
                prefer:"return=minimal"
            }
        );
        



        // Get more response info...

        // const { statusCode, headers } = httpResponse;

        return {

            result,

            newTransaction,
            finalProducts

        };

    } catch (error) {

        if (error instanceof ApiError) {
            console.error(error);
          
            throw new Error(error.message);

        }

    }

    return {result:undefined, newTransaction};
};