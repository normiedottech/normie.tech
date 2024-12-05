CREATE TABLE IF NOT EXISTS "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"fiat_active" boolean DEFAULT true,
	"fiat_options" json DEFAULT '["0"]'::json,
	"fee_percentage" real DEFAULT 2.5,
	"fee_amount" real,
	CONSTRAINT "projects_project_id_unique" UNIQUE("project_id")
);
