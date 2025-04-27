CREATE TYPE "public"."plan_interval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'inactive', 'draft');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"productId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"interval" "plan_interval" DEFAULT 'month' NOT NULL,
	"intervalCount" integer DEFAULT 1 NOT NULL,
	"status" "plan_status" DEFAULT 'draft' NOT NULL,
	"externalPlanId" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plans" ADD CONSTRAINT "plans_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plans" ADD CONSTRAINT "plans_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
