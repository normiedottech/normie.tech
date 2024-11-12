import { getDocumentationHTML, parseValidDomain } from "@/utils";

import { API_VERSION, SDK_VERSION } from "@normietech/core/config/index";
import { Hono } from "hono";

import { Resource } from "sst";
import projectIdApp from "./[projectId]";
import stripeWebhookApp from "./[paymentId]/stripe-webhook";
import { apiKeyMiddleware } from "@/middleware/apiKey";


const v1App = new Hono();
v1App.route("/:projectId", projectIdApp)
v1App.route("payment/0/webhook", stripeWebhookApp)
export default v1App
