import { Hono } from 'hono';
import { checkoutBodySchema, parseProjectRegistryKey, paymentLinkBodySchema, PROJECT_REGISTRY } from "@normietech/core/config/project-registry/index";
import { parsePaymentRegistryId, PAYMENT_REGISTRY } from "@normietech/core/config/payment-registry/index";
import { getStripePaymentLinks, stripeCheckout, stripePaymentLink } from './payments/stripe-checkout';
import { withHandler } from '@/utils';
import { db } from '@normietech/core/database/index';
import { paymentLinks } from '@normietech/core/database/schema/index';

const paymentLinkApp = new Hono();

paymentLinkApp.get('/', withHandler(async (c) => {
    const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();

    const projectId = await parseProjectRegistryKey(projectIdParam);
    const paymentId = parsePaymentRegistryId(paymentIdParam);
    if(paymentId !== "0"){
       return c.json({ error: "Not implemented" }, 501);     
    }
    const paymentLinks = await getStripePaymentLinks(projectId);
    console.log({paymentLinks})
    return c.json(paymentLinks, 200);
    
}));

// Route for processing transaction and creating a Stripe checkout session
paymentLinkApp.post('/', withHandler(async (c) => {
    const { projectId: projectIdParam, paymentId: paymentIdParam } = c.req.param<any>();

    const projectId = await parseProjectRegistryKey(projectIdParam);
    const paymentId = parsePaymentRegistryId(paymentIdParam);
    if(paymentId !== "0"){
       return c.json({ error: "Not implemented" }, 501);     
    }
    const bodyRaw = await  c.req.json()
  
    const url = await stripePaymentLink(bodyRaw,projectId)
    await db.insert(paymentLinks).values({
        link: url.url,
        projectId: projectId
    })
    return c.json({ url: url.url},200);
}));

// Export the checkoutApp as default for serverless deployment compatibility
export default paymentLinkApp;
