ALTER TABLE "users" RENAME TO "project_payment_users";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_paymentUserId_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentUserId_project_payment_users_id_fk" FOREIGN KEY ("paymentUserId") REFERENCES "public"."project_payment_users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
