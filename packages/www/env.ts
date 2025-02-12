import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    API_URL: z.string().default("https://api.normie.tech"),
    STAGE: z.string().default("dev"),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().default("https://api.normie.tech"),
    NEXT_PUBLIC_STAGE: z.string().default("dev"),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().default(""),
    
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    STAGE: process.env.STAGE,
    NEXT_PUBLIC_STAGE: process.env.NEXT_PUBLIC_STAGE,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,

  },
});
