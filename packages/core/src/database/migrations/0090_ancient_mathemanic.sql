CREATE TABLE IF NOT EXISTS "liquidity_and_payout_addresses_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"payoutAddress" text NOT NULL,
	"liquidityProviderId" text,
	"totalVolume" real DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "liquidity_providers" ADD COLUMN "isFallback" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "liquidity_providers" ADD COLUMN "riskPercentage" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "liquidity_providers" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "liquidity_providers" ADD COLUMN "liquidityPercentage" real DEFAULT 1.5 NOT NULL;--> statement-breakpoint
ALTER TABLE "liquidity_providers" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "zelle_transactions" ADD COLUMN "payoutAddress" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liquidity_and_payout_addresses_settings" ADD CONSTRAINT "liquidity_and_payout_addresses_settings_liquidityProviderId_liquidity_providers_id_fk" FOREIGN KEY ("liquidityProviderId") REFERENCES "public"."liquidity_providers"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
