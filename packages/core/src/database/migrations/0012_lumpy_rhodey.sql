ALTER TABLE "public"."transactions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TYPE "public"."transaction_status" ADD VALUE 'fiat-confirmed';--> statement-breakpoint
-- CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'confirmed-onchain', 'failed', 'cancelled', 'refunded', 'fiat-confirmed');--> statement-breakpoint
ALTER TABLE "public"."transactions" ALTER COLUMN "status" SET DATA TYPE "public"."transaction_status" USING "status"::"public"."transaction_status";