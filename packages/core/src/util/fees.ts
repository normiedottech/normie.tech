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
}
export const getAmountInFiatWithFees = (amount: number, paymentProcessor: keyof typeof PAYMENT_PROCESSOR_FEES, additionalPercentage: number = 0,ignorePaymentProcessorFees: boolean = false) => {
    const paymentProcessorFee = ignorePaymentProcessorFees ? 0 : PAYMENT_PROCESSOR_FEES[paymentProcessor].feePercentage
    const decimalPercentage = additionalPercentage / 100
    const final = (amount + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedFee + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedOffset) / (1 - (paymentProcessorFee + decimalPercentage))
    return final
}

interface FeeBreakdown {
  finalAmount: number;    // Final amount after all fees
  processorFee: number;   // Payment processor's fee
  additionalFee: number; // Additional percentage fee
  totalFees: number;     // Total of all fees
}

export const extractFeesFromAmountInFiat = (
  amount: number, 
  paymentProcessor: keyof typeof PAYMENT_PROCESSOR_FEES,
  additionalPercentage: number = 0,
  ignorePaymentProcessorFees: boolean = false,
  additionalFixedFee: number = 0
): FeeBreakdown => {
  // Get processor fee percentage and fixed fee
  const processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];
  const processorPercentage = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
  const processorFixed = ignorePaymentProcessorFees ? additionalFixedFee : processorConfig.fixedFee + additionalFixedFee;

  // Calculate processor fees
  const processorFee = (amount * (processorPercentage)) + processorFixed;

  // Calculate amount after processor fees
  const amountAfterProcessorFee = amount - processorFee;

  // Calculate additional fees based on amount after processor fees
  const additionalFee = amountAfterProcessorFee * (additionalPercentage / 100);

  // Calculate total fees
  const totalFees = processorFee + additionalFee;

  // Calculate final amount after all fees
  const finalAmount = amountAfterProcessorFee - totalFees;

  return {
    finalAmount: Number(finalAmount.toFixed(2)),
    processorFee: Number(processorFee.toFixed(2)),
    additionalFee: Number(additionalFee.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2))
  };
};
