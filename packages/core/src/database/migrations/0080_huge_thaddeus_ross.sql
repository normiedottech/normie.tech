CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'suspended', 'pending', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"planId" text NOT NULL,
	"productId" text NOT NULL,
	"paymentUserId" text,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"externalSubscriptionId" text NOT NULL,
	"paymentProcessorId" "paymentProcessorEnum" NOT NULL,
	"currentPeriodStart" timestamp with time zone,
	"currentPeriodEnd" timestamp with time zone,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"cancelledAt" timestamp with time zone,
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "project_settings" ADD COLUMN "activate_subscription" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paymentUserId_project_payment_users_id_fk" FOREIGN KEY ("paymentUserId") REFERENCES "public"."project_payment_users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paymentProcessorId_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("paymentProcessorId") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
