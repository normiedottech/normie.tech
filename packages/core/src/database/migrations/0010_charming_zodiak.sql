ALTER TABLE "transactions" ADD COLUMN "finalAmountInFiat" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paymentProcessFeesInFiat" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platformFeesInFiat" real DEFAULT 0;