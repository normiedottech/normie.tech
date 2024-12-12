ALTER TABLE "projects" ADD COLUMN "referral_percentage" real DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "referralFeesInFiat" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "referral" text;