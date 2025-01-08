import { event } from "sst/event";
import { ZodValidator } from "sst/event/validator";
import { transactionSelectSchemaWithPaymentUser } from "./database/schema";
import { z } from "zod";
import {
  blockchainNamesSchema,
  ChainIdSchema,
  WalletTypeSchema,
} from "./wallet/types";
import { Transaction } from "ethers";
const defineEvent = event.builder({
  validator: ZodValidator,
});
export const WebhookEvents = {
  Transaction: {
    Created: defineEvent(
      "transaction.created",
      transactionSelectSchemaWithPaymentUser
    ),
    OnChainConfirmed: defineEvent(
      "transaction.onChainConfirmed",
      transactionSelectSchemaWithPaymentUser
    ),
    FiatConfirmed: defineEvent(
      "transaction.fiatConfirmed",
      transactionSelectSchemaWithPaymentUser
    ),
  },
};

export const InternalEvents = {
  Transaction: {
    OnChainConfirmed: defineEvent(
      "transaction.onChainConfirmed",
      z.object({
        type: WalletTypeSchema,
        blockchainName: blockchainNamesSchema,
        chainId: ChainIdSchema,
        originAddress: z.string(),
      })
    ),
  },
};
