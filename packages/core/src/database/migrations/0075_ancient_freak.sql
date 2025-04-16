CREATE TYPE "public"."zellePaymentConfirmationStatusEnum" AS ENUM('wait-for-payment-details', 'payment-confirmed-by-sender', 'payment-confirmed-by-admin', 'confirmed-but-settle-later', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zelle_manual_payments_metadata" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transactionId" text,
	"payoutDetails" text DEFAULT '',
	"amount" real DEFAULT 0,
	"currency" text DEFAULT 'USD',
	"confirmationStatus" "zellePaymentConfirmationStatusEnum" DEFAULT 'wait-for-payment-details',
	"errorMessage" text,
	"successMessage" text,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zelle_manual_payments_metadata" ADD CONSTRAINT "zelle_manual_payments_metadata_transactionId_transactions_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
