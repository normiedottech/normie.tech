import "dotenv/config"
export const secrets = {
    RESERVE_KEY: new sst.Secret("RESERVE_KEY"),
    GASLESS_KEY: new sst.Secret("GASLESS_KEY"),
    TRON_GASLESS_KEY: new sst.Secret("TRON_GASLESS_KEY"),
    TRON_RESERVE_KEY: new sst.Secret("TRON_RESERVE_KEY"), 
    SOLANA_GASLESS_KEY: new sst.Secret("SOLANA_GASLESS_KEY"),
    SOLANA_RESERVE_KEY: new sst.Secret("SOLANA_RESERVE_KEY"),
    SOLANA_RPC_URL: new sst.Secret("SOLANA_RPC_URL"),
    SOLANA_DEV_NET_RPC_URL: new sst.Secret("SOLANA_DEV_NET_RPC_URL"),
    OP_RPC_URL: new sst.Secret("OP_RPC_URL"),
    ARBITRUM_RPC_URL: new sst.Secret("ARBITRUM_RPC_URL"),
    BASE_RPC_URL: new sst.Secret("BASE_RPC_URL"),
    ETH_SEPOLIA_RPC_URL: new sst.Secret("ETH_SEPOLIA_RPC_URL"),
    ETH_MAINNET_RPC_URL: new sst.Secret("ETH_MAINNET_RPC_URL"),
    TRON_RPC_URL: new sst.Secret("TRON_RPC_URL"), 
    TRON_NILE_RPC_URL: new sst.Secret("TRON_NILE_RPC_URL"),
    CELO_RPC_URL: new sst.Secret("CELO_RPC_URL"),
    POLYGON_RPC_URL: new sst.Secret("POLYGON_RPC_URL"),
    GNOSIS_RPC_URL: new sst.Secret("GNOSIS_RPC_URL"),
    STRIPE_API_KEY: new sst.Secret("STRIPE_API_KEY"),
    DATABASE_URL: new sst.Secret("DATABASE_URL"),
    ENCRYPTION_KEY: new sst.Secret("ENCRYPTION_KEY"),
    NEXT_PUBLIC_POSTHOG_KEY: new sst.Secret("NEXT_PUBLIC_POSTHOG_KEY",process.env.NEXT_PUBLIC_POSTHOG_KEY),
    NEXT_PUBLIC_POSTHOG_HOST: new sst.Secret("NEXT_PUBLIC_POSTHOG_HOST",process.env.NEXT_PUBLIC_POSTHOG_HOST),
    BETTER_AUTH_SECRET: new sst.Secret("BETTER_AUTH_SECRET"),
    RESEND_API_KEY: new sst.Secret("RESEND_API_KEY"),
    API_URL: new sst.Secret("API_URL","https://api.normie.tech"),
    IDENTITY_STRIPE_API: new sst.Secret(
      "IDENTITY_STRIPE_API"
    ),
    IDENTITY_WEBHOOK_SECRET: new sst.Secret(
      "IDENTITY_WEBHOOK_SECRET"
    ),
    SQUARE_AUTH_TOKEN: new sst.Secret("SQUARE_AUTH_TOKEN"),
    SQUARE_WEBHOOK_SECRET: new sst.Secret("SQUARE_WEBHOOK_SECRET"),
    DEBRIDGE_API: new sst.Secret("DEBRIDGE_API"),
    TELEGRAM_BOT_TOKEN: new sst.Secret("TELEGRAM_BOT_TOKEN"),
    
    PAYPAL_CLIENT_ID: new sst.Secret("PAYPAL_CLIENT_ID"),
    PAYPAL_SECRET: new sst.Secret("PAYPAL_SECRET"),

  }; 
export const allSecrets = Object.values(secrets);