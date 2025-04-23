export const PAYMENT_PROCESSOR_FEES = {
  "paypal": {
      "feePercentage": 0.0349,
      "fixedFee": 0.49,
      "fixedOffset": 0
  },
  "deposyt": {
      "feePercentage": 0.045,
      "fixedFee": 0.25,
      "fixedOffset": 0
  },
  "zelle-pheonix": {
      "feePercentage": 0,
      "fixedFee": 0,
      "fixedOffset": 0
  }
} as const; // Added 'as const' for better type inference of keys

export const getAmountInFiatWithFees = (
  amount: number,
  paymentProcessor: keyof typeof PAYMENT_PROCESSOR_FEES,
  additionalPercentage: number = 0,
  ignorePaymentProcessorFees: boolean = false
): number => { // Added return type annotation
  const paymentProcessorFee = ignorePaymentProcessorFees ? 0 : PAYMENT_PROCESSOR_FEES[paymentProcessor].feePercentage;
  const decimalPercentage = additionalPercentage / 100;
  const final = (amount + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedFee + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedOffset) / (1 - (paymentProcessorFee + decimalPercentage));
  return final;
};

export interface FeeBreakdown {
  finalAmount: number;    // Final amount after all fees
  processorFee: number;   // Payment processor's fee
  additionalFee: number;  // Additional percentage fee
  totalFees: number;      // Total of all fees
}

export const extractFeesFromAmountInFiat = (
  amount: number,
  paymentProcessor: keyof typeof PAYMENT_PROCESSOR_FEES,
  additionalPercentage: number = 0,
  ignorePaymentProcessorFees: boolean = false,
  additionalFixedFee: number = 0,
  additionalPaymentProcessorFeedFee: number = 0
): FeeBreakdown => { // Added return type annotation
  const processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];
    const processorPercentage = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
    // Updated fixed fee calculation to include additionalPaymentProcessorFeedFee,
    // and setting processorFixed to 0 when ignorePaymentProcessorFees is true
    const processorFixed = ignorePaymentProcessorFees ? 0 : processorConfig.fixedFee + additionalPaymentProcessorFeedFee;

    // Calculate processor fees
    // Based on the initial amount provided
    const processorFee = (amount * processorPercentage) + processorFixed;

    // Calculate additional fees based on the amount *after* subtracting processor fees
    // This part of the logic seems to imply fees are calculated sequentially.
    const amountAfterProcessorFee = amount - processorFee;
    const additionalFee = (amountAfterProcessorFee * (additionalPercentage / 100)) + additionalFixedFee;


    // Calculate total fees
    const totalFees = processorFee + additionalFee;

    // FIX: Calculate final amount by subtracting total fees from the initial amount
    const finalAmount = amount - totalFees;


  return {
      finalAmount: Number(finalAmount.toFixed(2)),
      processorFee: Number(processorFee.toFixed(2)),
      additionalFee: Number(additionalFee.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2))
  };
};