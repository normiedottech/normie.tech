import "dotenv/config"
export const secrets = {
    RESERVE_KEY: new sst.Secret("RESERVE_KEY"),
    GASLESS_KEY: new sst.Secret("GASLESS_KEY"),
    TRON_GASLESS_KEY: new sst.Secret("TRON_GASLESS_KEY"),
    TRON_RESERVE_KEY: new sst.Secret("TRON_RESERVE_KEY"),
    SOLANA_GASLESS_KEY: new sst.Secret("SOLANA_GASLESS_KEY"),
    SOLANA_RESERVE_KEY: new sst.Secret("SOLANA_RESERVE_KEY"),
    HELIUS_RPC_URL: new sst.Secret("HELIUS_RPC_URL"),
    HELIUS_WS_URL: new sst.Secret("HELIUS_WS_URL"),
    OP_RPC_URL: new sst.Secret("OP_RPC_URL"),
    ARBITRUM_RPC_URL: new sst.Secret("ARBITRUM_RPC_URL"),
    BASE_RPC_URL: new sst.Secret("BASE_RPC_URL"),
    TRON_RPC_URL: new sst.Secret("TRON_RPC_URL"),
    STRIPE_API_KEY: new sst.Secret("STRIPE_API_KEY"),
    DATABASE_URL: new sst.Secret("DATABASE_URL"),
    ENCRYPTION_KEY: new sst.Secret("ENCRYPTION_KEY"),
    NEXT_PUBLIC_POSTHOG_KEY: new sst.Secret("NEXT_PUBLIC_POSTHOG_KEY",process.env.NEXT_PUBLIC_POSTHOG_KEY),
    NEXT_PUBLIC_POSTHOG_HOST: new sst.Secret("NEXT_PUBLIC_POSTHOG_HOST",process.env.NEXT_PUBLIC_POSTHOG_HOST),
  }; 
export const allSecrets = Object.values(secrets);