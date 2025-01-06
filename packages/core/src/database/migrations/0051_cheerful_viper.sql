CREATE TABLE IF NOT EXISTS "failed_stripe_transactions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"payment_intent_id" varchar(255) NOT NULL,
	"payment_link" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"failure_message" text,
	"amount" integer,
	"created_at" timestamp DEFAULT now()
);
