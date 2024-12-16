ALTER TABLE "payment_links" ADD COLUMN "createdAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_links" ADD COLUMN "updatedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "createdAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updatedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isAdmin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp with time zone;