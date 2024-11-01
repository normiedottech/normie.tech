import { routes } from "./routes"
import { secrets } from "./secrets"
// import { stripeWebhook } from "./stripe"
import { apiPlans } from "./api-plans"
import { apiPlansToKeys } from "./api-plans-to-keys"
import { PAYMENT_REGISTRY } from "./constants"
import { apiKeys } from "./api-keys"

// ROUTER INITIALIZATION
/*========================================================================================================*/
export const router = new sst.aws.ApiGatewayV1("Normie-Tech-API-V1",{
    accessLog:{
      retention:"3 months"
    },
    cors:false,
    
    domain:$app.stage === "production" ? "api.normie.tech" : undefined,
});
/*========================================================================================================*/
//routes setup
for(const route of routes){
  router.route(route.url,route.handler,route.args)
}
/*========================================================================================================*/

/*========================================================================================================*/
// STRIP SETUP 
sst.Linkable.wrap(stripe.WebhookEndpoint, (endpoint) => {
    return {
      properties: {
        id: endpoint.id,
        secret: endpoint.secret,
      },
    };
  });
export const stripePayment = PAYMENT_REGISTRY.find((payment) => payment.name === 'stripe');
export const stripeWebhook = new stripe.WebhookEndpoint('PaymentWebhookForId', {
      url: $interpolate`${router.url}payment/${stripePayment.id}/webhook`,
      metadata: {
        stage: $app.stage,
      },
      enabledEvents: ['checkout.session.completed'],
});
/*========================================================================================================*/
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
/*========================================================================================================*/


type PlansType = {
  [key:string]:aws.apigateway.UsagePlanKey
}
const plans : PlansType = {}

for(const [apiPlan,apiKeys] of Object.entries(apiPlansToKeys)){
    const plan = new aws.apigateway.UsagePlan(apiPlan,{
        ...apiPlans[apiPlan as keyof typeof apiPlans].args,
        apiStages:[{
            apiId:router.nodes.api.id,
            stage:$app.stage
        }]
    })
    for(const [apiKeyName,apiKey] of Object.entries(apiKeys)){
        const planToKey = new aws.apigateway.UsagePlanKey(`${apiKeyName}-In-${apiPlan}`,{
            keyId:apiKey.id,
            keyType:"API_KEY",
            usagePlanId:plan.id
        })
        plans[apiPlan] = planToKey
    }
}

router.deploy() // This will deploy the API Gateway

export const outputs = {
    apiEndpoint: router.url,
    apiUrn: router.urn,
    plans:plans,
    stripeWebhookEndpoint: stripeWebhook.url,
    apiKeys:apiKeys
}