import { CheckoutPaymentIntent, Client, Environment, LogLevel, Order, OrdersController } from '@paypal/paypal-server-sdk'
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

export const PaypalClient = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: '',
        oAuthClientSecret: ''
    },
    timeout: 0,
    environment: Resource.App.stage === "production" ? Environment.Production : Environment.Sandbox,
    logging: {
        logLevel: Resource.App.stage === "production" ? LogLevel.Error : LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true }
    }
})

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
        case "sarafu": {
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
        const orderRequest = {
            intent: CheckoutPaymentIntent.Capture,
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: body.amount
                },
                custom_id: metadataId,
                description: body.description,
            }],
            application_context: {
                brand_name: PROJECT_REGISTRY[projectId as keyof typeof PROJECT_REGISTRY].name,
                user_action: 'PAY_NOW',
                return_url: body.success_url,
            }
        };

        const response = await OrdersController.ordersCreate(PaypalClient, orderRequest);
        console.log(response.result)
        console.log(response.result.status);

        // const orderId = response.result.id;
        // const captureResponse = await OrdersController.ordersCapture(orderId); // this should be in a seperate function....
        // const transactionId = captureResponse.result.purchase_units[0].payments.captures[0].id;
        // console.log(transactionId);
        return {result:response as Order, newTransaction }; 
    } catch (error) {
        console.error(error);
    }
}

export const capturePayPalOrder = async (orderId: string) => {
    try {

      const { result: capturedOrder } = await OrdersController.ordersCapture(PaypalClient, orderId);
  
      const captureData = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0];
      return captureData?.id;

    } catch (error) {
      console.error('PayPal Capture Error:', error);
      throw new Error(`Payment capture failed: ${error.message}`);
    }
  };
  
