CREATE TYPE "public"."paymentProcessorEnum" AS ENUM('stripe', 'square', 'paypal', 'deposyt', 'unknown');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_processors" (
	"id" varchar PRIMARY KEY NOT NULL,
	"paymentProcessorId" "paymentProcessorEnum" NOT NULL,
	"description" text,
	"averageFeePercentage" real DEFAULT 0,
	"averageFixedFee" real DEFAULT 0,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "payment_processors_paymentProcessorId_unique" UNIQUE("paymentProcessorId")
);

INSERT INTO "payment_processors" ("id", "paymentProcessorId", "description", "averageFeePercentage", "averageFixedFee", "createdAt", "updatedAt") VALUES ('2', 'deposyt', 'Deposyt', 0.045, 0.25, now(), now());
INSERT INTO "payment_processors" ("id", "paymentProcessorId", "description", "averageFeePercentage", "averageFixedFee", "createdAt", "updatedAt") VALUES ('1', 'paypal', 'Paypal', 0.0349, 0.4, now(), now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status_code" integer,
	"response_body" text,
	"response_headers" jsonb,
	"error" text,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"duration_ms" integer,
	"successful" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"secret" varchar(128) NOT NULL,
	"description" text,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"max_retries_per_minute" integer DEFAULT 5 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "project_settings" ADD COLUMN "deposyt_enable_3ds" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project_settings" ADD COLUMN "first_preferred_payment_processor" "paymentProcessorEnum" DEFAULT 'paypal';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paymentProcessorId" "paymentProcessorEnum";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_first_preferred_payment_processor_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("first_preferred_payment_processor") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentProcessorId_payment_processors_paymentProcessorId_fk" FOREIGN KEY ("paymentProcessorId") REFERENCES "public"."payment_processors"("paymentProcessorId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
