import { routes } from "./routes"
import { secrets } from "./secrets"
// import { stripeWebhook } from "./stripe"
// import { apiPlans } from "./api-plans"
import { apiPlansToKeys } from "./api-plans-to-keys"
import { PAYMENT_REGISTRY } from "./constants"
import { apiKeys } from "./api-keys"

// ROUTER INITIALIZATION
/*========================================================================================================*/
export const router = new sst.aws.ApiGatewayV1("Normie-Tech-API-V1",{
    accessLog:{
      retention:"forever"
    },
    cors:$app.stage === "production" ? true : false,
    domain:$app.stage === "production" ? "api.normie.tech" : `${$app.stage}.api.normie.tech`,
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

type ApiPlanNames = "Basic-Plan-Normie-Tech-V1";
type ApiPlan = {
    [key in ApiPlanNames]: {
        args?: aws.apigateway.UsagePlanArgs;
    };
};
export const apiPlans  = {
    
    [`Basic-Plan-Normie-Tech-V1-${$app.stage}`]:{
        args:{
          
              description:"initial paid plan for V1",
              name:"Basic Normie Tech Plan V1",
              throttleSettings:{
                burstLimit:1000,
                rateLimit:1000
              }
        }
    }
} as ApiPlan;

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
    // plans:plans,
    stripeWebhookEndpoint: stripeWebhook.url,
    apiKeys:apiKeys
}