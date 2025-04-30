CREATE TABLE IF NOT EXISTS "referrers" (
	"referralId" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"referredBy" text,
	"projectId" text,
	"totalVolume" real DEFAULT 0 NOT NULL,
	"amountEarned" real DEFAULT 0 NOT NULL,
	"amountClaimed" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrers" ADD CONSTRAINT "referrers_referredBy_referrers_referralId_fk" FOREIGN KEY ("referredBy") REFERENCES "public"."referrers"("referralId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrers" ADD CONSTRAINT "referrers_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
