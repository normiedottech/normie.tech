CREATE TABLE IF NOT EXISTS "payout_balance" (
	"projectId" text,
	"balance" real DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"paidOut" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_transactions" (
	"projectId" text NOT NULL,
	"payoutSettings" text NOT NULL,
	"amountInFiat" real DEFAULT 0 NOT NULL,
	"onChainTransactionId" text,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
ALTER TABLE "payouts_settings" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "payouts_settings" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_balance" ADD CONSTRAINT "payout_balance_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_payoutSettings_payouts_settings_id_fk" FOREIGN KEY ("payoutSettings") REFERENCES "public"."payouts_settings"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
