import { secrets } from "./secrets"
import { internalEventBus, webhookEventBus } from "./event";


// ROUTER INITIALIZATION
/*========================================================================================================*/
export const router = new sst.aws.ApiGatewayV2("API-V1_1",{
      domain:$app.stage === "production" ? "api.normie.tech" : $app.stage === "dev" ? "api-dev.normie.tech" : $app.stage === "sandbox" ? "api-sandbox.normie.tech" : undefined,
      cors:true,
      
});



/*========================================================================================================*/
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
        secrets.WORLD_CHAIN_RPC_URL,
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
        secrets.PAYPAL_WEBHOOK_ID,
        secrets.ETH_MAINNET_RPC_URL,
        secrets.TELEGRAM_BOT_TOKEN,
        secrets.BASE_SEPOLIA_RPC_URL,
        secrets.CELO_ALFAJORES_RPC_URL,
        router, 
        internalEventBus,
        secrets.DEPOSYT_PRIVATE_KEY,
        secrets.DEPOSYT_PUBLIC_KEY,
        secrets.DEPOSYT_PUBLIC_CHECKOUT_KEY,
        webhookEventBus,
        secrets.EMAIL_PARSING_WEBHOOK_SECRET
        // stripeWebhook,
        // identityWebhook,
    ]
})
export const outputs = {
    apiEndpoint: router.url,
    // stripeWebhookEndpoint: stripeWebhook.url,
    // identityWebhookEndpoint: identityWebhook.url, 
    
}