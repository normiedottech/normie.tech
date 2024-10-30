CREATE TABLE IF NOT EXISTS "paymentMetadataTable" (
	"id" varchar PRIMARY KEY NOT NULL,
	"metadataJson" json,
	"paymentId" text,
	"externalId" text
);
