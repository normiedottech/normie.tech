import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { Hono } from "hono";
import { stripeCheckoutRefund } from "./payments/stripe-checkout";

const refundApp = new Hono()

refundApp.post("/",async (c) => {
    const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();
    const { transactionId, refundAmountInCents } = await c.req.json<{transactionId:string,refundAmountInCents:number}>();
    if (!projectIdParam || !paymentIdParam) {
        return c.json({ error: "Missing path parameters" }, 400);
    }
    const projectId = await parseProjectRegistryKey(projectIdParam);

    
    const a = await stripeCheckoutRefund(projectId, transactionId, refundAmountInCents)
    return c.json(a)
})
export default refundApp