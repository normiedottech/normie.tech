import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/database/migrations',
  schema: './src/database/schema/index.ts',
  dialect: 'postgresql',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});