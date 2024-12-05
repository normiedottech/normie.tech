CREATE TYPE "public"."settlement_type" AS ENUM('payout', 'smart-contract');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "settlement_type" "settlement_type" DEFAULT 'payout';