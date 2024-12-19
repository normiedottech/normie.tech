CREATE TYPE "public"."blockchain_types" AS ENUM('ethereum', 'polygon', 'celo', 'arbitrum-one', 'sepolia-eth', 'evm', 'tron', 'solana');--> statement-breakpoint
CREATE TYPE "public"."payout_period_type" AS ENUM('custom', 'instant', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts_settings" (
	"blockchain" text DEFAULT 'evm' NOT NULL,
	"chainId" integer DEFAULT 0,
	"payoutAddress" text,
	"isActive" boolean DEFAULT false NOT NULL,
	"payoutPeriod" "payout_period_type" NOT NULL,
	"id" text,
	"projectId" text,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts_settings" ADD CONSTRAINT "payouts_settings_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
