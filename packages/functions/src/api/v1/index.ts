
import { Hono } from "hono";


import projectIdApp from "./[projectId]";
import stripeWebhookApp from "./[paymentId]/stripe-webhook";
import { withHandler } from "@/utils";
import { stripeVerificationSession } from "./[projectId]/[paymentId]/payments/stripe-checkout";
import identityApp from "./identity";
import squareUpWebhookApp from "./[paymentId]/square-up-webhook";



const v1App = new Hono();

v1App.route("/:projectId", projectIdApp)
v1App.route("payment/0/webhook", stripeWebhookApp)
v1App.route("payment/1/webhook",squareUpWebhookApp)
v1App.route("/identity",identityApp)
export default v1App
