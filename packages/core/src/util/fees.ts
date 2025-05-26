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
      "feePercentage": 0.015,
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
  console.log("amount",amount)
  console.log("paymentProcessor",paymentProcessor)
  const paymentProcessorFee = ignorePaymentProcessorFees ? 0 : PAYMENT_PROCESSOR_FEES[paymentProcessor].feePercentage;
  const decimalPercentage = additionalPercentage / 100;
  console.log("paymentProcessorFee",paymentProcessorFee)
  console.log("decimalPercentage",decimalPercentage)
  const final = (amount + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedFee + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedOffset) / (1 - (paymentProcessorFee + decimalPercentage));
  console.log("final",final)
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
  let processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];
  let processorPercentage = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
  let processorFixed = ignorePaymentProcessorFees ? 0 : processorConfig.fixedFee + additionalPaymentProcessorFeedFee;

  // Calculate processor fees based on the initial amount
  let processorFee = Number(((amount * processorPercentage) + processorFixed).toFixed(2));

  // Calculate additional fees based on the initial amount
  let additionalFee = Number(((amount * (additionalPercentage / 100)) + additionalFixedFee).toFixed(2));

  // Calculate total fees
  let totalFees = Number((processorFee + additionalFee).toFixed(2))

  // Calculate final amount by subtracting total fees from the initial amount
  let finalAmount = amount - totalFees;


  return {
      finalAmount: Number(finalAmount.toFixed(2)),
      processorFee: Number(processorFee.toFixed(2)),
      additionalFee: Number(additionalFee.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2))
  };
};