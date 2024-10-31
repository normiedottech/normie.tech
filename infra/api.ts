import { apiPlans } from "./api-plans"
import { apiPlansToKeys } from "./api-plans-to-keys"
import { PAYMENT_REGISTRY } from "./constants"
import {router} from "./router"
import { routes } from "./routes"
import { secrets } from "./secrets"
import { stripeWebhook } from "./stripe"

for(const route of routes){
  router.route(route.url,route.handler,route.args)
}
for(const payment of PAYMENT_REGISTRY){
    if(payment.isWebhookActive){
      switch(payment.name){
        case 'stripe':
          router.route(`POST /payment/${payment.id}/webhook`,{
            handler:payment.handler,
            link: [
              secrets.GASLESS_KEY,
              secrets.RESERVE_KEY,
              secrets.OP_RPC_URL,
              secrets.ARBITRUM_RPC_URL,
              secrets.BASE_RPC_URL,
              secrets.DATABASE_URL,
              stripeWebhook
            ]
            
          })
          break;
      }
      
    }
}

type PlansType = {
  [key:string]:aws.apigateway.UsagePlanKey
}
const plans : PlansType = {}

for(const [apiPlan,apiKeys] of Object.entries(apiPlansToKeys)){
    const plan = new aws.apigateway.UsagePlan(apiPlan,apiPlans[apiPlan as keyof typeof apiPlans].args)
    for(const [apiKeyName,apiKey] of Object.entries(apiKeys)){
        const planToKey = new aws.apigateway.UsagePlanKey(`${apiKeyName}-In-${apiPlan}`,{
            keyId:apiKey.id,
            keyType:"API_KEY",
            usagePlanId:plan.id
        })
        plans[apiPlan] = planToKey
    }
}

router.deploy()

export const outputs = {
    apiEndpoint: router.url,
    apiUrn: router.urn,
    plans:plans,
    stripeWebhookEndpoint: stripeWebhook.url,
}