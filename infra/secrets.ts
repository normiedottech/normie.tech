import "dotenv/config"
export const secrets = {
    RESERVE_KEY: new sst.Secret("RESERVE_KEY"),
    GASLESS_KEY: new sst.Secret("GASLESS_KEY"),
    OP_RPC_URL: new sst.Secret("OP_RPC_URL"),
    ARBITRUM_RPC_URL: new sst.Secret("ARBITRUM_RPC_URL"),
    BASE_RPC_URL: new sst.Secret("BASE_RPC_URL"),
    STRIPE_API_KEY: new sst.Secret("STRIPE_API_KEY"),
    DATABASE_URL: new sst.Secret("DATABASE_URL"),
    ENCRYPTION_KEY: new sst.Secret("ENCRYPTION_KEY"),
    NEXT_PUBLIC_POSTHOG_KEY: new sst.Secret("NEXT_PUBLIC_POSTHOG_KEY",process.env.NEXT_PUBLIC_POSTHOG_KEY),
    NEXT_PUBLIC_POSTHOG_HOST: new sst.Secret("NEXT_PUBLIC_POSTHOG_HOST",process.env.NEXT_PUBLIC_POSTHOG_HOST),
    BETTER_AUTH_SECRET: new sst.Secret("BETTER_AUTH_SECRET"),
    RESEND_API_KEY: new sst.Secret("RESEND_API_KEY")
  }; 
export const allSecrets = Object.values(secrets);