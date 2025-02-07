import { secrets } from "./secrets"

const webhookEventBus = new sst.aws.Bus('WebhookEventBus')

webhookEventBus.subscribe("WebhookHandler",{
    handler:"packages/functions/src/events/webhook-handler.handler",
    link:[webhookEventBus]
})

export const internalEventBus = new sst.aws.Bus('InternalEventBus')
internalEventBus.subscribe("InternalHandler",{
    handler:"packages/functions/src/events/internal-handler.handler",
    link:[internalEventBus, secrets.GASLESS_KEY,
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
        secrets.SQUARE_AUTH_TOKEN,
        secrets.TELEGRAM_BOT_TOKEN,
        
      secrets.IDENTITY_WEBHOOK_SECRET]
})
export const outputs = {
    webhookEventBusUrn:webhookEventBus.urn,
    webhookEventBusName:webhookEventBus.name,
    internalEventBusUrn:internalEventBus.urn,
    internalEventBusName:internalEventBus.name
}