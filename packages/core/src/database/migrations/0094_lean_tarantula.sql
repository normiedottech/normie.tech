DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'liquidity_providers' 
        AND column_name = 'lastLowLiquidityNotified'
    ) THEN
        ALTER TABLE "liquidity_providers" ADD COLUMN "lastLowLiquidityNotified" timestamp with time zone;
    END IF;
END $$; 