import { WebhookEvents } from "@normietech/core/event";
import { bus } from "sst/aws/bus";

export const handler = bus.subscriber(
  [
    WebhookEvents.Transaction.Created,
    WebhookEvents.Transaction.OnChainConfirmed,
    WebhookEvents.Transaction.FiatConfirmed,
  ],
  async (event) => {
    switch (event.type) {
      case "transaction.created":
        
        console.log("Transaction created");
        break;
      case "transaction.onChainConfirmed":
        console.log("Transaction onChainConfirmed");
        break;
      case "transaction.fiatConfirmed":
        console.log("Transaction fiatConfirmed");
    }
  }
);
