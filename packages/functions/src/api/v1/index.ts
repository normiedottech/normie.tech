import { Hono } from "hono";

import { withHandler } from "@/utils";
import deposytCaptureOrderApp from "./[paymentId]/deposyt/deposyt-capture-transaction";
import paypalCaptureOrderApp from "./[paymentId]/paypal-capture-order";
import squareUpWebhookApp from "./[paymentId]/square-up-webhook";
import stripeWebhookApp from "./[paymentId]/stripe-webhook";
import projectIdApp from "./[projectId]";
import { stripeVerificationSession } from "./[projectId]/[paymentId]/payments/stripe-checkout";

const v1App = new Hono();

v1App.route("/:projectId", projectIdApp);
v1App.route("payment/0/webhook", stripeWebhookApp);
v1App.route("payment/1/webhook", squareUpWebhookApp);
v1App.route("payment/3/capture", paypalCaptureOrderApp);
v1App.route("payment/4/capture", deposytCaptureOrderApp);
// v1App.route("/identity",identityApp)
export default v1App;
