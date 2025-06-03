CREATE TABLE IF NOT EXISTS "liquidity_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"paymentProcessorId" "paymentProcessorEnum",
	"email" text,
	"walletAddress" text NOT NULL,
	"walletKey" text NOT NULL,
	"zelleId" text,
	"zelleName" text,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zelle_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"internalTransactionId" text,
	"zelleId" text,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "zellePaymentConfirmationStatusEnum" NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "liquidity_providers" ADD CONSTRAINT "liquidity_providers_paymentProcessorId_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("paymentProcessorId") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
