import { evmClient } from "@normietech/core/blockchain-client/index";
import { checkoutBodySchema, PROJECT_REGISTRY, ProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { transactions } from "@normietech/core/database/schema/index";
import { Resource } from "sst";
import Stripe from "stripe";
import { erc20Abi } from "viem";
import {z} from "zod"
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);
export const stripeCheckout = async (rawBody:string,body:z.infer<typeof checkoutBodySchema>,projectId: ProjectRegistryKey,transaction: typeof transactions.$inferInsert | undefined,metadataId:string ) => {
    
    let newTransaction =  {...transaction};
    switch(projectId){
        case "voice-deck":{
            const metadata = PROJECT_REGISTRY[projectId].routes.checkout[0].bodySchema.parse(body).metadata;
            const decimals = await evmClient(metadata.chainId).readContract({
                abi: erc20Abi,
                functionName: "decimals",
                address: metadata.order.currency as `0x${string}`,
            });
            
            newTransaction = {        
                    ...transaction,
                    chainId: metadata.chainId,
                    metadataJson: JSON.stringify(metadata),
                    amountInFiat: body.amount / 100,
                    currencyInFiat: "USD",
                    token: metadata.order.currency,
                    amountInToken: metadata.amountApproved,
                    decimals: decimals,
            }
        }
        case "viaprize":{

        }
       
    }
    const session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        success_url: body.success_url,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                description: body.description,
                name: body.name,
                images: body.images,
              },
              unit_amount: body.amount,
            },
            quantity: 1,
          },
        ],
        customer_email:body.customerEmail && body.customerEmail!=="" ? body.customerEmail :undefined,
        metadata: {
          metadataId: metadataId,
          projectId: projectId,
        }
    });

    return {session,newTransaction};
}