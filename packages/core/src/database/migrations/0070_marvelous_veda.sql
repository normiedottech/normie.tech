CREATE TYPE "public"."paymentProcessorEnum" AS ENUM('stripe', 'square', 'paypal', 'deposyt', 'unknown');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_processors" (
	"id" varchar PRIMARY KEY NOT NULL,
	"paymentProcessorId" "paymentProcessorEnum" NOT NULL,
	"description" text,
	"averageFeePercentage" real DEFAULT 0,
	"averageFixedFee" real DEFAULT 0,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "payment_processors_paymentProcessorId_unique" UNIQUE("paymentProcessorId")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paymentProcessorId" "paymentProcessorEnum";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentProcessorId_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("paymentProcessorId") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
