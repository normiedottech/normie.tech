export const PAYMENT_REGISTRY =[ {
        id: "0",
        name: "stripe",
        isWebhookActive: true,
        handler: "packages/functions/src/api/v1/[paymentId]/stripe-webhook.post",
        isCheckoutInUrl: true,
    }
 ]