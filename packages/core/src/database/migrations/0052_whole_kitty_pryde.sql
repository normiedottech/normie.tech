CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" real,
	"currency" text DEFAULT 'USD',
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
