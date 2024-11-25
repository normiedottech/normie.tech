CREATE TABLE IF NOT EXISTS "wallets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"blockchain" text NOT NULL,
	"projectId" text NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	"key" text
);
