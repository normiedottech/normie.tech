import { ApiError, CheckoutPaymentIntent, Client, Environment, LogLevel, Order, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk'
import { checkoutBodySchema, paymentLinkBodySchema, payoutMetadataSchema, PROJECT_REGISTRY, ProjectRegistryKey } from '@normietech/core/config/project-registry/index'
import { getProjectById, getPayoutSettings } from "@normietech/core/config/project-registry/utils";
import { z } from "zod";
import { Resource } from 'sst';
import { projects, transactions } from "@normietech/core/database/schema/index";
import { SARAFU_CUSD_TOKEN } from "@normietech/core/sarafu/index";
import { USD_TOKEN_ADDRESSES, blockchainNamesSchema } from "@normietech/core/wallet/types";
import { erc20Abi } from "viem";
import { evmClient, getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { eq } from 'drizzle-orm';
import { db } from '@normietech/core/database/index';

export const paypalClient = new Client({

    clientCredentialsAuthCredentials: {

        oAuthClientId: "AaQ_VB2BmOVHTya-29Y5U0Ef_56uqay_0vDGuKcPVbWbnXeqbEh-Ud85KxvALTTL1XXLJNmk8k-Gyjrj",

        oAuthClientSecret: "EMiDMjzzBDHINt4hyeZgPCIkL20TYPRK6qeKhjg7OJtt6CER2shZOLiIKlQ0v6uhIlmtwt4rdb9BXdo-",

    },

    timeout: 0,

    environment: Environment.Sandbox,

    logging: {

        logLevel: LogLevel.Info,

        logRequest: { logBody: true },

        logResponse: { logHeaders: true },

    },

}); 




const ordersController = new OrdersController(paypalClient);

const paymentsController = new PaymentsController(paypalClient)

export const paypalCheckout = async (
    body: z.infer<typeof checkoutBodySchema>,
    projectId: ProjectRegistryKey | string,
    transaction: typeof transactions.$inferInsert | undefined,
    metadataId: string
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
    try {

        const { result } = await ordersController.ordersCreate(

            {
                body:{
                    intent:CheckoutPaymentIntent.Capture,
                    
                    purchaseUnits:[
                        {
                            customId:metadataId,
                            amount:{
                                currencyCode:"USD",
                                value:body.amount.toString()    
                            },
                            description:body.description,
                            items:[{
                                name:body.name,
                                unitAmount:{
                                    currencyCode:"USD",
                                    value:body.amount.toString()
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

            newTransaction

        };

    } catch (error) {

        if (error instanceof ApiError) {

            throw new Error(error.message);

        }

    }

    return {result:undefined, newTransaction};
};