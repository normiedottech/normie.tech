
import { Hono } from "hono";


import projectIdApp from "./[projectId]";
import stripeWebhookApp from "./[paymentId]/stripe-webhook";
import { withHandler } from "@/utils";
import { stripeVerificationSession } from "./[projectId]/[paymentId]/payments/stripe-checkout";
import squareUpWebhookApp from "./[paymentId]/square-up-webhook";
import {paypalCaptureOrderApp} from "./[paymentId]/paypal-capture-order";
import deposytCaptureOrderApp from "./[paymentId]/deposyt/deposyt-capture-transaction";
import phoenixCaptureOrderApp from "./[paymentId]/zelle-pheonix/zelle-pheonix-capture-transaction";
import phoenixDetailsOrderApp from "./[paymentId]/zelle-pheonix/zelle-pheonix-payment-details-update";
import paypalWebhookApp from "./[paymentId]/paypal-webhook";



const v1App = new Hono();

v1App.route("/:projectId", projectIdApp)
v1App.route("payment/0/webhook", stripeWebhookApp)
v1App.route("payment/1/webhook",squareUpWebhookApp)
v1App.route("payment/3/capture",paypalCaptureOrderApp)
v1App.route("payment/3/webhook",paypalWebhookApp)
v1App.route("payment/4/capture",deposytCaptureOrderApp)
v1App.route("payment/5/capture",phoenixCaptureOrderApp)
v1App.route("payment/5/details",phoenixDetailsOrderApp)
// v1App.route("/identity",identityApp)
export default v1App
