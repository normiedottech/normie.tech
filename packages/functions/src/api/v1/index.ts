
import { Hono } from "hono";


import projectIdApp from "./[projectId]";
import stripeWebhookApp from "./[paymentId]/stripe-webhook";



const v1App = new Hono();
v1App.route("/:projectId", projectIdApp)
v1App.route("payment/0/webhook", stripeWebhookApp)

export default v1App
