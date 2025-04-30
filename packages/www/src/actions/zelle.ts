"use server"
import { eq } from "drizzle-orm";
import { zellePaymentsMetadata, transactions } from "@normietech/core/database/schema/index";
import { db } from "@normietech/core/database/index";
import { auth } from "@/server/auth";
import { zellePaymentConfirmationStatusEnum } from "@normietech/core/database/schema/index";

type ZellePayment = typeof zellePaymentsMetadata.$inferSelect;
type Transaction = typeof transactions.$inferSelect;

type Result<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type UpdatePayoutDetailsInput = {
  payoutDetails: string;
  amount?: number;
};

type VerifyTransactionInput = {
  blockchainTransactionId: string;
  finalAmountInFiat: number;
  platformFeesInFiat: number;
  paymentProcessFeesInFiat: number;
};

export async function fetchZelleMetadata(transactionId: string): Promise<Result<ZellePayment>> {
  try {
    const metadata = await db.query.zellePaymentsMetadata.findFirst({
      where: eq(zellePaymentsMetadata.transactionId, transactionId),
    });

    if (!metadata) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    console.error("Error fetching Zelle metadata:", error);
    return {
      success: false,
      error: "Failed to fetch payment details",
    };
  }
}

export async function updateZelleMetadata(
  transactionId: string,
  metadata: Partial<ZellePayment>
): Promise<Result<ZellePayment>> {
  try {
    const user = await auth();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    if (!user.user.isAdmin) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const updatedPayment = await db
      .update(zellePaymentsMetadata)
      .set(metadata)
      .where(eq(zellePaymentsMetadata.transactionId, transactionId))
      .returning();

    if (!updatedPayment[0]) {
      return {
        success: false,
        error: "Failed to update payment",
      };
    }

    return {
      success: true,
      data: updatedPayment[0],
    };
  } catch (error) {
    console.error("Error updating Zelle metadata:", error);
    return {
      success: false,
      error: "Failed to update payment",
    };
  }
}

export async function updateZelleToGetDetail(transactionId: string, phoneNumber?: string): Promise<Result<ZellePayment>> {
  try {

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });
  
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }
  
    let referralId: string | undefined;
  
    

    const updatedPayment = await db
      .update(zellePaymentsMetadata)
      .set({
        confirmationStatus: "wait-for-payment-details",
      })
      .where(eq(zellePaymentsMetadata.transactionId, transactionId))
      .returning();

    if (!updatedPayment[0]) {
      return {
        success: false,
        error: "Failed to update payment status",
      };
    }

    return {
      success: true,
      data: updatedPayment[0],
    };
  } catch (error) {
    console.error("Error updating Zelle status:", error);
    return {
      success: false,
      error: "Failed to update payment status",
    };
  }
}

export async function updateZelleToConfirmPayment(transactionId: string): Promise<Result<ZellePayment>> {
  try {
    const updatedPayment = await db
      .update(zellePaymentsMetadata)
      .set({
        confirmationStatus: "payment-confirmed-by-sender",
      })
      .where(eq(zellePaymentsMetadata.transactionId, transactionId))
      .returning();

    if (!updatedPayment[0]) {
      return {
        success: false,
        error: "Failed to confirm payment",
      };
    }

    return {
      success: true,
      data: updatedPayment[0],
    };
  } catch (error) {
    console.error("Error confirming Zelle payment:", error);
    return {
      success: false,
      error: "Failed to confirm payment",
    };
  }
}

export async function fetchAllZellePayments(): Promise<Result<ZellePayment[]>> {
  console.log("fetchAllZellePayments")
  try {
    const user = await auth();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    // if (!user.user.isAdmin) {
    //   return {
    //     success: false,
    //     error: "Unauthorized",
    //   };
    // }

    const payments = await db.query.zellePaymentsMetadata.findMany({});
    
    // Sort payments: non-admin confirmed first, then by createdAt
    const sortedPayments = payments.sort((a, b) => {
      if (a.confirmationStatus === "payment-confirmed-by-admin" && b.confirmationStatus !== "payment-confirmed-by-admin") {
        return 1;
      }
      if (a.confirmationStatus !== "payment-confirmed-by-admin" && b.confirmationStatus === "payment-confirmed-by-admin") {
        return -1;
      }
      return new Date(b.createdAt ?? new Date()).getTime() - new Date(a.createdAt ?? new Date()).getTime();
    });

    return {
      success: true,
      data: sortedPayments,
    };
  } catch (error) {
    console.error("Error fetching Zelle payments:", error);
    return {
      success: false,
      error: "Failed to fetch payments",
    };
  }
}

export async function getTransactionWithPayoutAddress(transactionId: string): Promise<Result<{ payoutAddress: string }>> {
  try {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    const metadata = transaction.metadataJson as { payoutAddress?: string };
    if (!metadata?.payoutAddress) {
      return {
        success: false,
        error: "Payout address not found in transaction metadata",
      };
    }

    return {
      success: true,
      data: {
        payoutAddress: metadata.payoutAddress,
      },
    };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      error: "Failed to fetch transaction details",
    };
  }
}

export async function confirmZellePayment(
  transactionId: string,
  blockchainTransactionHash: string
): Promise<Result<{ zellePayment: ZellePayment; transaction: Transaction }>> {
  try {
    const user = await auth();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    if (!user.user.isAdmin) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Update Zelle payment status
    const updatedZellePayment = await db
      .update(zellePaymentsMetadata)
      .set({
        confirmationStatus: "payment-confirmed-by-admin",
      })
      .where(eq(zellePaymentsMetadata.transactionId, transactionId))
      .returning();

    if (!updatedZellePayment[0]) {
      return {
        success: false,
        error: "Failed to update Zelle payment status",
      };
    }

    // Update associated transaction
    const updatedTransaction = await db
      .update(transactions)
      .set({
        status: "confirmed-onchain",
        blockchainTransactionId: blockchainTransactionHash,
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    if (!updatedTransaction[0]) {
      return {
        success: false,
        error: "Failed to update transaction status",
      };
    }

    return {
      success: true,
      data: {
        zellePayment: updatedZellePayment[0],
        transaction: updatedTransaction[0],
      },
    };
  } catch (error) {
    console.error("Error confirming Zelle payment:", error);
    return {
      success: false,
      error: "Failed to confirm payment",
    };
  }
}

export async function updatePayoutDetails(
  transactionId: string,
  input: UpdatePayoutDetailsInput
): Promise<Result<ZellePayment>> {
  try {
    const user = await auth();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    if (!user.user.isAdmin) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // First check if the payment exists and is in the correct status
    const existingPayment = await db.query.zellePaymentsMetadata.findFirst({
      where: eq(zellePaymentsMetadata.transactionId, transactionId),
    });

    if (!existingPayment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    if (existingPayment.confirmationStatus !== "wait-for-payment-details") {
      return {
        success: false,
        error: "Payment is not in wait-for-payment-details status",
      };
    }
    if(!existingPayment.transactionId) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Update the payment with new details
    
    const [updatedPayment, updatedTransaction] = await db.batch([
      db
      .update(zellePaymentsMetadata)
      .set({
        payoutDetails: input.payoutDetails,
        amount: input.amount ?? existingPayment.amount,
      })
      .where(eq(zellePaymentsMetadata.transactionId, transactionId))
      .returning(),
      db.update(transactions).set({
        externalPaymentProviderId:existingPayment.payoutDetails,
        amountInFiat: input.amount ?? existingPayment.amount,
      }).where(eq(transactions.id, existingPayment.transactionId))

    ]);

    if (!updatedPayment[0]) {
      return {
        success: false,
        error: "Failed to update payment details",
      };
    }

    return {
      success: true,
      data: updatedPayment[0],
    };
  } catch (error) {
    console.error("Error updating payout details:", error);
    return {
      success: false,
      error: "Failed to update payment details",
    };
  }
}

export async function verifyTransaction(
  transactionId: string,
  input: VerifyTransactionInput
): Promise<Result<{ zellePayment: ZellePayment; transaction: Transaction }>> {
  try {
    const user = await auth();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }
    if (!user.user.isAdmin) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // First check if the payment exists and is in the correct status
    const existingPayment = await db.query.zellePaymentsMetadata.findFirst({
      where: eq(zellePaymentsMetadata.transactionId, transactionId),
    });

    if (!existingPayment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    if (existingPayment.confirmationStatus !== "payment-confirmed-by-sender") {
      return {
        success: false,
        error: "Payment is not in payment-confirmed-by-sender status",
      };
    }

    // Calculate amount in token (assuming 6 decimals for USDC)
    const amountInToken = input.finalAmountInFiat * Math.pow(10, 6);

    // Update both the Zelle payment and transaction in a batch
    const [updatedZellePayment, updatedTransaction] = await db.batch([
      // Update Zelle payment status
      db
        .update(zellePaymentsMetadata)
        .set({
          confirmationStatus: "payment-confirmed-by-admin",
        })
        .where(eq(zellePaymentsMetadata.transactionId, transactionId))
        .returning(),
      
      // Update transaction details
      db
        .update(transactions)
        .set({
          blockchainTransactionId: input.blockchainTransactionId,
          finalAmountInFiat: input.finalAmountInFiat,
          platformFeesInFiat: input.platformFeesInFiat,
          paymentProcessFeesInFiat: input.paymentProcessFeesInFiat,
          amountInToken: amountInToken,
          status: "confirmed-onchain",
        })
        .where(eq(transactions.id, transactionId))
        .returning(),
    ]);

    if (!updatedZellePayment[0] || !updatedTransaction[0]) {
      return {
        success: false,
        error: "Failed to update payment and transaction",
      };
    }

    return {
      success: true,
      data: {
        zellePayment: updatedZellePayment[0],
        transaction: updatedTransaction[0],
      },
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      success: false,
      error: "Failed to verify transaction",
    };
  }
}
