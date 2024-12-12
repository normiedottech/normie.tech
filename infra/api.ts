import { secrets } from "./secrets"
import { PAYMENT_REGISTRY } from "./constants"

// ROUTER INITIALIZATION
/*========================================================================================================*/
export const router = new sst.aws.ApiGatewayV2("API-V1",{
      domain:$app.stage === "production" ? "api.normie.tech" : undefined,
      cors:true,
      
});



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
      url: $interpolate`${router.url}/v1/payment/${stripePayment.id}/webhook`,
      metadata: {
        stage: $app.stage,
      },
      enabledEvents: ['checkout.session.completed','charge.updated'],
});


router.route("ANY /{proxy+}",{
    handler:"packages/functions/src/api/index.handler",
    link:[
        secrets.GASLESS_KEY,
        secrets.RESERVE_KEY,
        secrets.OP_RPC_URL,
        secrets.ARBITRUM_RPC_URL,
        secrets.BASE_RPC_URL,
        secrets.DATABASE_URL,
        secrets.STRIPE_API_KEY,
        secrets.ENCRYPTION_KEY,
        secrets.BETTER_AUTH_SECRET,
        secrets.ETH_SEPOLIA_RPC_URL,
        secrets.DEFAULT_CHAIN_ID,
        secrets.DEFAULT_CHAIN_NAME,
        router,
        stripeWebhook
    ]
})
export const outputs = {
    apiEndpoint: router.url,
    stripeWebhookEndpoint: stripeWebhook.url, 
}