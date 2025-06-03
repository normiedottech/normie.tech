ALTER TABLE "zelle_transactions" ADD COLUMN "transactionId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zelle_transactions" ADD CONSTRAINT "zelle_transactions_transactionId_transactions_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "zelle_transactions" DROP COLUMN IF EXISTS "status";