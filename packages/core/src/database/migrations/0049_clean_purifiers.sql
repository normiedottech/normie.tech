CREATE TABLE IF NOT EXISTS "stripe_failed_transactions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"failure_message" text,
	"amount" integer,
	"created_at" timestamp DEFAULT now()
);
