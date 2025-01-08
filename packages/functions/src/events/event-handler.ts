import { bus } from "sst/aws/bus";
import { InternalEvents } from "@normietech/core/event";
export const handler = bus.subscriber(
  [InternalEvents.Transaction.OnChainConfirmed],
  async (event) => {
    switch (event.type) {
      case "transaction.onChainConfirmed":
        console.log("Transaction onChainConfirmed");
        break;
    }
  }
);
