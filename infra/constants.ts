export const PAYMENT_REGISTRY =[ {
        id: "0",
        name: "stripe",
        isWebhookActive: true,
        handler: "packages/functions/src/api/payment/stripe-webhook.handler",
        isCheckoutInUrl: true,
    }
 ]