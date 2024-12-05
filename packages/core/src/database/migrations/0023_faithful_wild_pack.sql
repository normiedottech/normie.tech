ALTER TABLE "projects" DROP CONSTRAINT "projects_project_id_unique";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "project_id";