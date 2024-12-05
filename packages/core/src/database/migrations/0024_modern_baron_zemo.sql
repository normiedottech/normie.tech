ALTER TABLE "projects" ADD COLUMN "projectId" text UNIQUE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "projectId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_projectId_unique" UNIQUE("projectId");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_projectId_unique" UNIQUE("projectId");