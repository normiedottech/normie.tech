ALTER TABLE "transactions" ALTER COLUMN "token" SET DEFAULT 'USDC';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "projectId" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "blockChainName" text DEFAULT 'evm';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "amountInToken" real DEFAULT 0 NOT NULL;