export const secrets = {
    RESERVE_KEY: new sst.Secret("RESERVE_KEY"),
    GASLESS_KEY: new sst.Secret("GASLESS_KEY"),
    OP_RPC_URL: new sst.Secret("OP_RPC_URL"),
    ARBITRUM_RPC_URL: new sst.Secret("ARBITRUM_RPC_URL"),
    BASE_RPC_URL: new sst.Secret("BASE_RPC_URL"),
    STRIPE_API_KEY: new sst.Secret("STRIPE_API_KEY")
  }; 
export const allSecrets = Object.values(secrets);