CREATE TYPE "public"."donationTokenTypeEnum" AS ENUM('TOKEN', 'NFT');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'confirmed-onchain', 'failed', 'cancelled', 'refunded', 'confirmed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"projectId" text,
	"paymentId" text,
	"externalPaymentProviderId" text,
	"chainId" integer DEFAULT 10,
	"blockchainTransactionId" text,
	"paymentUserId" varchar,
	"amountInFiat" real,
	"currencyInFiat" varchar,
	"token" varchar NOT NULL,
	"decimals" integer DEFAULT 6 NOT NULL,
	"tokenType" "donationTokenTypeEnum" DEFAULT 'TOKEN',
	"metadataJson" json DEFAULT '{}'::json,
	"status" "transaction_status" DEFAULT 'pending'
);
--> statement-breakpoint
ALTER TABLE "paymentMetadataTable" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paypalId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phoneNumber" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updatedAt" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentUserId_users_id_fk" FOREIGN KEY ("paymentUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "metadataJson";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "projectId";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "paymentId";