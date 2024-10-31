import "dotenv/config";
import { PAYMENT_REGISTRY } from "./constants";
import { router } from "./router";
import { secrets } from "./secrets";

sst.Linkable.wrap(stripe.WebhookEndpoint, (endpoint) => {
    return {
      properties: {
        id: endpoint.id,
        secret: endpoint.secret,
      },
    };
  });
export const stripePayment = PAYMENT_REGISTRY.find((payment) => payment.name === 'stripe');
export const stripeWebhook = new stripe.WebhookEndpoint('PaymentWebhookForId', {
      url: $interpolate`${router.url}payment/${stripePayment.id}/webhook`,
      metadata: {
        stage: $app.stage,
      },
      enabledEvents: ['checkout.session.completed'],
});
  

