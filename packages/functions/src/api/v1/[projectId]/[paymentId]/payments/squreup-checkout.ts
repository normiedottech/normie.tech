import { evmClient, getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { checkoutBodySchema, paymentLinkBodySchema, payoutMetadataSchema, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { getProjectById, getPayoutSettings } from "@normietech/core/config/project-registry/utils";
import { projects, transactions } from "@normietech/core/database/schema/index";
import { SARAFU_CUSD_TOKEN } from "@normietech/core/sarafu/index";
import { USD_TOKEN_ADDRESSES, blockchainNamesSchema } from "@normietech/core/wallet/types";
import { Resource } from "sst";
import { erc20Abi } from "viem";
import { z } from "zod";
import { Client, CreatePaymentLinkResponse, Environment, ListLocationsResponse } from "square"
export const squareClient = new Client({
    bearerAuthCredentials: {
        accessToken: Resource.SQUARE_AUTH_TOKEN.value 
      },
    environment: Resource.App.stage === "production" ? Environment.Production : Environment.Sandbox,
})
export const squareCheckout = async (
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
    const allLocations = await squareClient.locationsApi.listLocations()
    const locationId = allLocations.result?.locations?.[0]?.id
  
    
    
    const session = await squareClient.checkoutApi.createPaymentLink({
      
       checkoutOptions:{
        redirectUrl:Resource.App.stage === "production" ? `https://normie.tech/checkout/success?transactionId=${newTransaction.id}&projectId=${projectId}` : undefined,
       },
        prePopulatedData:{
          buyerEmail:body.customerEmail,
          
        },
        description:body.description,
       order:{
        locationId:locationId ?? "L9QGP5JPG08B4",
        metadata:{
          metadataId:metadataId,
          projectId:projectId,
          paymentType:"checkout",
          stage:Resource.App.stage
        },
         lineItems:[{
          quantity:"1",
          metadata:{
            metadataId:metadataId,
            projectId:projectId,
            paymentType:"checkout",
            stage:Resource.App.stage
          },
          basePriceMoney:{
            amount:BigInt(body.amount),
            currency:"USD"
          },
          name:body.name,
         }] 
       }
    })
    console.log(session.result)
    return { session:session.result as CreatePaymentLinkResponse , newTransaction };
};

export const squareUpPaymentLink = async (rawBody: string, projectId: string) => {
  const body = paymentLinkBodySchema.parse(rawBody);
 
  const allLocations = await squareClient.locationsApi.listLocations()
  const locationId = allLocations.result?.locations?.[0]?.id

  const res = await squareClient.checkoutApi.createPaymentLink({
    description:body.name,
    order:{
      locationId:locationId ?? "L9QGP5JPG08B4",
      metadata:{
        projectId:projectId,
        paymentType:"paymentLink",
        stage:Resource.App.stage
      },
       lineItems:[{
        quantity:"1",
        metadata:{
        
          projectId:projectId,
          paymentType:"paymentLink",
          stage:Resource.App.stage
        },
        basePriceMoney:{
          amount:BigInt(0),
          currency:"USD"
        },

        itemType:"CUSTOM_AMOUNT",
        
       }] 
       
       
     }
  })

  return res.result.paymentLink
};
