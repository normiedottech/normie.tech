ALTER TABLE "paymentMetadataTable" ALTER COLUMN "metadataJson" SET DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "paymentMetadataTable" ADD COLUMN "projectId" text;