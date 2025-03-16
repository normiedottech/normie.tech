ALTER TABLE "projects" ALTER COLUMN "fee_percentage" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "rolling_reserve_percentage" real DEFAULT 0 NOT NULL;