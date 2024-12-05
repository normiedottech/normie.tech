CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"projectName" text NOT NULL,
	"url" text,
	"fiatActive" boolean DEFAULT true NOT NULL,
	"fiatOptions" json DEFAULT '["0"]'::json NOT NULL,
	"feePercentage" real DEFAULT 2.5 NOT NULL,
	"feeAmount" real DEFAULT 0 NOT NULL,
	CONSTRAINT "projects_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
DROP TABLE "account";--> statement-breakpoint
DROP TABLE "jwks";--> statement-breakpoint
DROP TABLE "session";--> statement-breakpoint
DROP TABLE "user";--> statement-breakpoint
DROP TABLE "verification";