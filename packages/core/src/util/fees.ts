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
  const processorConfig = PAYMENT_PROCESSOR_FEES[paymentProcessor];
  const processorPercentage = ignorePaymentProcessorFees ? 0 : processorConfig.feePercentage;
  const processorFixed = ignorePaymentProcessorFees ? additionalFixedFee : processorConfig.fixedFee;

  // Calculate processor fees
  // Note: The original TypeScript code's calculation for processorFee seems incorrect
  // if 'amount' is supposed to be the *final* amount after fees.
  // It calculates processorFee as (amount * percentage) + fixed, then subtracts
  // this from the initial 'amount' to get 'amountAfterProcessorFee', and then
  // calculates additionalFee based on this 'amountAfterProcessorFee'.
  // This implies 'amount' is the *initial* amount before any fees.
  // I will keep the original logic for the conversion, assuming 'amount' is the initial amount.
  // If 'amount' is the final amount, the logic would need to be different
  // to reverse the fee calculation.

  const processorFee = (amount * processorPercentage) + processorFixed;

  // Calculate amount after processor fees
  const amountAfterProcessorFee = amount - processorFee;

  // Calculate additional fees based on amount after processor fees
  const additionalFee = (amountAfterProcessorFee * (additionalPercentage / 100)) + additionalFixedFee;

  // Calculate total fees
  const totalFees = processorFee + additionalFee;

  // Calculate final amount after all fees
  // This calculation seems incorrect based on the previous steps.
  // If amountAfterProcessorFee is amount - processorFee, then
  // finalAmount = (amount - processorFee) - (processorFee + additionalFee)
  // This seems wrong. Assuming the intent was to subtract totalFees from the initial amount.
  // Or perhaps calculate fees *on top of* the initial amount?
  // Let's recalculate based on adding fees to the initial amount or
  // calculating fees based on the initial amount and then subtracting.
  // Based on the FeeBreakdown structure and the `getAmountInFiatWithFees` function
  // which seems to calculate the final amount *including* fees, the `extractFees`
  // function might be intended to calculate the fees that *were* added to an initial amount
  // to reach the provided `amount`.
  // However, the current logic calculates fees based on the provided `amount` as if it were
  // the base amount *before* fees, and then subtracts these calculated fees from it.
  // This results in a `finalAmount` that is less than the input `amount`.
  // I will stick to the provided logic for the direct conversion, but highlight this potential discrepancy.

  // Original calculation:
  // const finalAmount = amountAfterProcessorFee - totalFees;
  // This simplifies to:
  // const finalAmount = (amount - processorFee) - totalFees
  // const finalAmount = amount - ((amount * processorPercentage) + processorFixed) - (((amount - ((amount * processorPercentage) + processorFixed)) * (additionalPercentage / 100)) + additionalFixedFee + ((amount * processorPercentage) + processorFixed))
  // This doesn't seem right.

  // Let's assume the function is meant to take an *initial* amount and show the breakdown
  // if fees were added *on top* of it, resulting in a higher final amount.
  // Or, the function takes the *final* amount and breaks down the fees that are included within it.
  // The naming `extractFeesFromAmountInFiat` suggests the latter (taking a final amount).
  // But the internal calculations don't seem to work correctly for that.

  // Given the direct request to convert the *provided* code, I will convert the logic exactly as written,
  // even if the mathematical outcome seems counter-intuitive for a function named `extractFeesFromAmountInFiat`.

  // Let's re-evaluate the provided calculation:
  // processorFee = (amount * processorPercentage) + processorFixed;
  // amountAfterProcessorFee = amount - processorFee; // This is the amount *after* subtracting the calculated processor fee.
  // additionalFee = (amountAfterProcessorFee * (additionalPercentage / 100)) + additionalFixedFee; // Additional fee based on the amount *after* processor fee.
  // totalFees = processorFee + additionalFee;
  // finalAmount = amountAfterProcessorFee - totalFees; // This subtracts *both* processorFee and additionalFee from the amount *after* subtracting processorFee.

  // Example trace: amount = 100, paypal, additionalPercentage = 0, ignorePaymentProcessorFees = false
  // processorPercentage = 0.0349
  // processorFixed = 0.49
  // processorFee = (100 * 0.0349) + 0.49 = 3.49 + 0.49 = 3.98
  // amountAfterProcessorFee = 100 - 3.98 = 96.02
  // additionalFee = (96.02 * (0/100)) + 0 = 0
  // totalFees = 3.98 + 0 = 3.98
  // finalAmount = 96.02 - 3.98 = 92.04
  // Result: { finalAmount: 92.04, processorFee: 3.98, additionalFee: 0, totalFees: 3.98 }
  // This means starting with 100, fees are calculated as 3.98, resulting in 92.04. This is not how fee extraction from a final amount usually works.

  // Let's assume the original code *is* correct in its logic according to its author's intent, however unusual.
  // Converting the *exact* logic provided:
  const finalAmount = amountAfterProcessorFee - totalFees;


  return {
      finalAmount: Number(finalAmount.toFixed(2)),
      processorFee: Number(processorFee.toFixed(2)),
      additionalFee: Number(additionalFee.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2))
  }; 
};
