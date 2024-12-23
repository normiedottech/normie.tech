ALTER TYPE "public"."on_board_stage" ADD VALUE 'kyc-completed';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_message" (
	"id" text PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"projectId" text,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_message" ADD CONSTRAINT "error_message_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
