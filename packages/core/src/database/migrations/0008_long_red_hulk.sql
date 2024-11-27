ALTER TABLE "api_keys" ADD COLUMN "secretKey" varchar;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_secretKey_unique" UNIQUE("secretKey");