export const PAYMENT_REGISTRY =[ {
        id: "0",
        name: "stripe",
        isWebhookActive: true,
        handler: "packages/functions/src/api/[paymentId]/stripe-webhook.post",
        isCheckoutInUrl: true,
    }
 ]