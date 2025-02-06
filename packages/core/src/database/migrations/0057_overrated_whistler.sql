CREATE TABLE IF NOT EXISTS "notification_token_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text DEFAULT 'NATIVE' NOT NULL,
	"minimum_balance" real NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"blockchain" "blockchain_types" NOT NULL,
	"chainId" integer DEFAULT 0 NOT NULL,
	"replenish_amount" real DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone,
	"updatedAt" timestamp with time zone
);
