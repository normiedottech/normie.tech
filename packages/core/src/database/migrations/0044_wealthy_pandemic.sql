-- 1) Remove the default on the "blockchain" column
ALTER TABLE "public"."payouts_settings"
  ALTER COLUMN "blockchain" DROP DEFAULT;

-- 2) Cast the column to text (so it no longer depends on the old enum)
ALTER TABLE "public"."payouts_settings"
  ALTER COLUMN "blockchain" SET DATA TYPE text USING "blockchain"::text;

-- 3) Now it's safe to drop the old enum type
DROP TYPE "public"."blockchain_types";

-- 4) Recreate the enum type with the updated values
CREATE TYPE "public"."blockchain_types" AS ENUM (
  'polygon', 'celo', 'arbitrum-one', 'sepolia-eth', 'evm', 'tron', 'solana', 'optimism'
);

-- 5) Reassign the column to the (newly created) enum type
ALTER TABLE "public"."payouts_settings"
  ALTER COLUMN "blockchain" SET DATA TYPE "public"."blockchain_types"
  USING "blockchain"::"public"."blockchain_types";


