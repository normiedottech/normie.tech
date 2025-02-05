CREATE TABLE IF NOT EXISTS "reserve_balances" (
	"usdc_optimism" real DEFAULT 0 NOT NULL,
	"usdc_celo" real DEFAULT 0 NOT NULL,
	"usdc_solana" real DEFAULT 0 NOT NULL,
	"usdc_arbitrum" real DEFAULT 0 NOT NULL,
	"eth_arbitrum" real DEFAULT 0 NOT NULL,
	"eth_optimism" real DEFAULT 0 NOT NULL,
	"celo" real DEFAULT 0 NOT NULL,
	"solana" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
