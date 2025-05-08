ALTER TABLE "zelle_manual_payments_metadata" ADD COLUMN "paymentProcessorId" "paymentProcessorEnum";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zelle_manual_payments_metadata" ADD CONSTRAINT "zelle_manual_payments_metadata_paymentProcessorId_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("paymentProcessorId") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
