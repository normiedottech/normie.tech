import { secrets } from "./secrets"
import { PAYMENT_REGISTRY } from "./constants"
import { internalEventBus } from "./event";


// ROUTER INITIALIZATION
/*========================================================================================================*/
export const router = new sst.aws.ApiGatewayV2("API-V1",{
      domain:$app.stage === "production" ? "api.normie.tech" : $app.stage === "dev" ? "api-dev.normie.tech" : undefined,
      cors:true,
      
});



// /*========================================================================================================*/
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
      enabledEvents: ['checkout.session.completed','charge.updated', "payment_intent.payment_failed", "charge.failed"],
});
export const identityWebhook = new stripe.WebhookEndpoint('IdentityWebhook', {
      url: $interpolate`${router.url}/v1/identity/webhook`,
      
      metadata: {
        stage: $app.stage,
      },
      enabledEvents: ['identity.verification_session.verified','identity.verification_session.requires_input'],
})

router.route("ANY /{proxy+}",{
    handler:"packages/functions/src/api/index.handler",
    timeout: "5 minutes",
    link:[
        secrets.GASLESS_KEY,
        secrets.RESERVE_KEY,
        secrets.TRON_GASLESS_KEY,
        secrets.TRON_RESERVE_KEY,
        secrets.SOLANA_GASLESS_KEY,
        secrets.SOLANA_RESERVE_KEY,
        secrets.SOLANA_RPC_URL,
        secrets.OP_RPC_URL,
        secrets.ARBITRUM_RPC_URL,
        secrets.BASE_RPC_URL,
        secrets.TRON_RPC_URL,
        secrets.CELO_RPC_URL,
        secrets.POLYGON_RPC_URL,
        secrets.DATABASE_URL,
        secrets.STRIPE_API_KEY,
        secrets.ENCRYPTION_KEY,
        secrets.BETTER_AUTH_SECRET,
        secrets.ETH_SEPOLIA_RPC_URL,
        secrets.TRON_NILE_RPC_URL,
        secrets.SOLANA_DEV_NET_RPC_URL, 
        secrets.GNOSIS_RPC_URL,
        secrets.IDENTITY_STRIPE_API,
        secrets.IDENTITY_WEBHOOK_SECRET,
        secrets.SQUARE_AUTH_TOKEN,
        secrets.SQUARE_WEBHOOK_SECRET,
        secrets.DEBRIDGE_API,
        secrets.PAYPAL_CLIENT_ID,
        secrets.PAYPAL_SECRET,
        secrets.ETH_MAINNET_RPC_URL,
        secrets.TELEGRAM_BOT_TOKEN,
        router, 
        internalEventBus,
        stripeWebhook,
        identityWebhook,
        internalEventBus
    ]
})
export const outputs = {
    apiEndpoint: router.url,
    stripeWebhookEndpoint: stripeWebhook.url,
    identityWebhookEndpoint: identityWebhook.url, 
    
}