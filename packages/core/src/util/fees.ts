export const PAYMENT_PROCESSOR_FEES = {
    "paypal": {
        "feePercentage": 0.0349,
        "fixedFee": 0.49,
        "fixedOffset": 0
    },
}
export const getAmountInFiatWithFees = (amount: number, paymentProcessor: keyof typeof PAYMENT_PROCESSOR_FEES, additionalPercentage: number = 0) => {
    const decimalPercentage = additionalPercentage / 100
    const final = (amount + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedFee + PAYMENT_PROCESSOR_FEES[paymentProcessor].fixedOffset) / (1 - (PAYMENT_PROCESSOR_FEES[paymentProcessor].feePercentage + decimalPercentage))
    return final
}