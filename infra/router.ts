import { apiKeys } from "./api-keys";
import { secrets } from "./secrets";

import { PAYMENT_REGISTRY } from './constants';
import 'dotenv/config';



const api = new sst.aws.ApiGatewayV1("Payment-Infra-Api-V1",{
  accessLog:{
    retention:"3 months"
  },
});


const plan = new aws.apigateway.UsagePlan("Basic-Plan-V1",{
  apiStages:[{
    apiId:api.nodes.api.id,
    stage:$app.stage
  }],
  description:"initial paid plan",
  
  name:"Basic Normie Tech Plan",
  throttleSettings:{
    burstLimit:1000,
    rateLimit:1000
  }
})
type PlansType = {
  [key:string]:aws.apigateway.UsagePlanKey
}
const plans : PlansType = {}
for (const key in apiKeys){
  const planToKeyName = `${key}-In-Basic-Plan-V1`

  const planToKey = new aws.apigateway.UsagePlanKey(planToKeyName,{
    keyId:apiKeys[key].id,
    keyType:"API_KEY",
    usagePlanId:plan.id
  })
  plans[key] = planToKey
}
api.route("GET /", {
  handler: "packages/functions/src/api/ping.handler",
})
api.route("GET /{projectId}/status", {
  handler: "packages/functions/src/api/[projectId]/is-active.get",
},{
  transform:{
    method:{
      apiKeyRequired:true
    }
  }
})

api.route("POST /{projectId}/{paymentId}/checkout",{
  handler:"packages/functions/src/api/[projectId]/[paymentId]/create.post",
  link:[
    secrets.STRIPE_API_KEY,
    secrets.DATABASE_URL
  ],
  timeout:"100 seconds"
})
// Register Stripe payment
sst.Linkable.wrap(stripe.WebhookEndpoint, (endpoint) => {
  return {
    properties: {
      id: endpoint.id,
      secret: endpoint.secret,
    },
  };
});
const stripePayment = PAYMENT_REGISTRY.find((payment) => payment.name === 'stripe');
const stripeWebhook = new stripe.WebhookEndpoint('PaymentWebhookForId', {
    url: $interpolate`${api.url}payment/${stripePayment.id}/webhook`,
    metadata: {
      stage: $app.stage,
    },
    enabledEvents: ['checkout.session.completed'],
});

for(const payment of PAYMENT_REGISTRY){
  if(payment.isWebhookActive){
    switch(payment.name){
      case 'stripe':
        api.route(`POST /payment/${payment.id}/webhook`,{
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

api.deploy()

export const outputs = {
  apiEndpoint: api.url,
  apiUrn: api.urn,
  // voiceDeckApiKey: voiceDeckApiKey.value,
  planId: plan.id,
  plans:plans,
  stripeWebhookEndpoint: stripeWebhook.url,
  // plans:Object.values(plans),
}