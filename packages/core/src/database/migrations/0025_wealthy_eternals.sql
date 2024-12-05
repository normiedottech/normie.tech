ALTER TABLE "user" DROP CONSTRAINT "user_projectId_unique";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "projectId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "payout_address_on_evm" text;