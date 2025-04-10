ALTER TABLE "payouts_settings" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_transactions" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;