CREATE TABLE IF NOT EXISTS "payment_links" (
	"id" varchar PRIMARY KEY NOT NULL,
	"projectId" text,
	"link" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "fee_percentage" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
