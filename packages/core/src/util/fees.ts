export const PAYMENT_PROCESSOR_FEES = {
  "paypal": {
    "feePercentage": 0.0349,
    "fixedFee": 0.49,
    "fixedOffset": 0  // Used in getAmountInFiatWithFees for calculating gross amount
  },
  "deposyt": {
    "feePercentage": 0.045,
    "fixedFee": 0.25,
    "fixedOffset": 0  // Used in getAmountInFiatWithFees
  },
  "zelle-pheonix": {
    "feePercentage": 0.015, // This was 0.015 in your original TS, updated as per JS
    "fixedFee": 0,
    "fixedOffset": 0  // Used in getAmountInFiatWithFees
  },
  "zelle-mail": {
    "feePercentage": 0.05, // This was 0.015 in your original TS, updated as per JS
    "fixedFee": 0,
    "fixedOffset": 0  // Used in getAmountInFiatWithFees
  }
} as const; // 'as const' provides stricter typing for keys and readonly properties

// Type for the keys of PAYMENT_PROCESSOR_FEES, e.g., "paypal" | "deposyt" | "zelle-pheonix"
export type PaymentProcessorKey = keyof typeof PAYMENT_PROCESSOR_FEES;

/**
 * Calculates the gross amount that needs to be charged to ensure the 'amount'
 * is received after all fees (payment processor and additional) are deducted.
 * Fees are calculated on the gross amount.
 *
 * @param amount The net amount desired to be received.
 * @param paymentProcessor The key for the payment processor.
 * @param additionalPercentage An additional percentage fee to apply (e.g., 1 for 1%).
 * @param ignorePaymentProcessorFees If true, processor fees are not added.
 * @returns The total gross amount to be charged.
 */
export const getAmountInFiatWithFees = (
  amount: number,
  paymentProcessor: PaymentProcessorKey,
  additionalPercentage: number = 0,
  ignorePaymentProcessorFees: boolean = false
): number => {
  console.log("getAmountInFiatWithFees - input amount (net desired):", amount);
  console.log("getAmountInFiatWithFees - paymentProcessor:", paymentProcessor);

  const processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];
  const processorPercentageRate = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
  const processorFixedFeeComponent = ignorePaymentProcessorFees ? 0 : processorConfig.fixedFee;
  const processorFixedOffsetComponent = ignorePaymentProcessorFees ? 0 : processorConfig.fixedOffset;

  const totalFixedFee = processorFixedFeeComponent + processorFixedOffsetComponent;
  const additionalDecimalPercentage = additionalPercentage / 100;
  const totalPercentageRate = processorPercentageRate + additionalDecimalPercentage;

  console.log("getAmountInFiatWithFees - processorPercentageRate:", processorPercentageRate);
  console.log("getAmountInFiatWithFees - additionalDecimalPercentage:", additionalDecimalPercentage);
  console.log("getAmountInFiatWithFees - totalFixedFee (processor fixed + offset):", totalFixedFee);

  if (1 - totalPercentageRate <= 0) {
    // This handles cases where total percentage is 100% or more,
    // which would lead to division by zero or a negative denominator.
    throw new Error("Total percentage fee rate is 100% or more, cannot calculate gross amount.");
  }

  // Formula: Gross = (Net + TotalFixedFees) / (1 - TotalPercentageRate)
  const grossAmount = (amount + totalFixedFee) / (1 - totalPercentageRate);
  console.log("getAmountInFiatWithFees - calculated grossAmount:", grossAmount);
  return grossAmount;
};

/**
 * Interface for the breakdown of fees from a gross amount.
 */
export interface FeeBreakdown {
  /** The net amount that the beneficiary receives after all fees are deducted from the gross amount. */
  finalAmount: number;
  /** The total fee attributable to the payment processor (includes its percentage and fixed parts). */
  processorFee: number;
  /** The total additional fee (includes its percentage and fixed parts). */
  additionalFee: number;
  /** The sum of processorFee and additionalFee. */
  totalFees: number;
}

/**
 * Extracts the fee components from a given gross transaction amount.
 * This function assumes percentage fees are calculated on the amount *after* fixed fees have been deducted.
 * GrossAmount = NetAmount + NetAmount * TotalPercentageRate_Applicable + TotalFixedFees_Overall
 * => GrossAmount - TotalFixedFees_Overall = NetAmount * (1 + TotalPercentageRate_Applicable)
 * => NetAmount = (GrossAmount - TotalFixedFees_Overall) / (1 + TotalPercentageRate_Applicable)
 *
 * @param grossAmount The total amount collected or transacted.
 * @param paymentProcessor The key for the payment processor.
 * @param additionalPercentage An additional percentage applied (e.g., 1 for 1%).
 * @param ignorePaymentProcessorFees If true, processor's fees (percentage and fixed) are considered zero.
 * @param additionalFixedFee A flat additional fee.
 * @param additionalPaymentProcessorFeedFee An additional fixed fee component specifically for the payment processor.
 * @returns A FeeBreakdown object.
 */
export const extractFeesFromAmountInFiat = (
  grossAmount: number,
  paymentProcessor: PaymentProcessorKey,
  additionalPercentage: number = 0,
  ignorePaymentProcessorFees: boolean = false,
  additionalFixedFee: number = 0,
  additionalPaymentProcessorFeedFee: number = 0
): FeeBreakdown => {
  const processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];

  const baseProcessorPercentage = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
  const baseProcessorFixedFee = ignorePaymentProcessorFees ? 0 : processorConfig.fixedFee;

  // Calculate actual fixed fee for the processor
  const actualProcessorFixedFee = baseProcessorFixedFee + additionalPaymentProcessorFeedFee;

  // Calculate the total sum of all fixed fees
  const totalFixedFeeOverall = actualProcessorFixedFee + additionalFixedFee;

  // Convert additional percentage to its decimal form
  const additionalPercentageDecimal = additionalPercentage / 100;

  // Sum of all applicable percentage rates
  const totalPercentageDecimalApplicable = baseProcessorPercentage + additionalPercentageDecimal;

  // The amount remaining after all fixed fees are subtracted from the gross amount.
  // This is the amount on which percentage fees will be based (Net + PercentageFeesOnNet).
  const amountAfterAllFixedFees = grossAmount - totalFixedFeeOverall;

  if (amountAfterAllFixedFees < 0) {
      console.warn(`Warning: Gross amount (${grossAmount}) is less than total fixed fees (${totalFixedFeeOverall}). Final amount will be negative or calculations might be skewed.`);
  }
  
  let netAmount: number; // This is the finalAmount the beneficiary gets
  let totalPercentageBasedFees: number; // The sum of all fees that are percentage-based

  if (1 + totalPercentageDecimalApplicable <= 0) {
    // This condition is unlikely with positive fee percentages but guards against division by zero/negative.
    throw new Error("Sum of applicable percentage rates results in a non-positive divisor.");
  }
  
  // Calculate the net amount: NetAmount = (AmountAfterAllFixedFees) / (1 + TotalPercentageRate_Applicable)
  netAmount = amountAfterAllFixedFees / (1 + totalPercentageDecimalApplicable);
  
  // Calculate the total amount of percentage-based fees
  totalPercentageBasedFees = amountAfterAllFixedFees - netAmount;
  
  let processorPercentageComponent: number;
  let additionalPercentageComponent: number;

  // Distribute the total percentage-based fees proportionally if totalPercentageDecimalApplicable > 0
  if (totalPercentageDecimalApplicable > 0) {
    processorPercentageComponent = (baseProcessorPercentage / totalPercentageDecimalApplicable) * totalPercentageBasedFees;
    additionalPercentageComponent = (additionalPercentageDecimal / totalPercentageDecimalApplicable) * totalPercentageBasedFees;
  } else {
    // If there are no percentage fees (e.g., both rates are 0), components are zero
    processorPercentageComponent = 0;
    additionalPercentageComponent = 0;
  }
  
  // Calculate the total fee for the payment processor
  const finalProcessorFee = processorPercentageComponent + actualProcessorFixedFee;
  
  // Calculate the total additional fee
  const finalAdditionalFee = additionalPercentageComponent + additionalFixedFee;
  
  // Calculate the grand total of all fees
  const finalTotalFees = totalPercentageBasedFees + totalFixedFeeOverall;
  // Alternative for total fees: finalProcessorFee + finalAdditionalFee; (should be equal)

  // Ensure final values are rounded to 2 decimal places for currency representation
  return {
    finalAmount: Number(netAmount.toFixed(2)),
    processorFee: Number(finalProcessorFee.toFixed(2)),
    additionalFee: Number(finalAdditionalFee.toFixed(2)),
    totalFees: Number(finalTotalFees.toFixed(2))
  };
};

