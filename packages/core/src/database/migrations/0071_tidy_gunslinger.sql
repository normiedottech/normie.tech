ALTER TABLE "project_settings" ADD COLUMN "first_preferred_payment_processor" "paymentProcessorEnum" DEFAULT 'paypal';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_first_preferred_payment_processor_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("first_preferred_payment_processor") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
