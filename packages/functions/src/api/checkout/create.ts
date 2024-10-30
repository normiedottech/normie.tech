import { APIGatewayProxyHandlerV2, } from "aws-lambda";
import {parseProjectRegistryKey} from "@normietech/core/project-registry/index"
import {parsePaymentRegistryId, PAYMENT_REGISTRY} from "@normietech/core/payment-registry/index"
import { z } from "zod";
import { assertNotNull, createErrorResponse ,withErrorHandling} from "../../utils";
import Stripe from "stripe";
const bodySchema = z.object({
    description: z.string().optional(),
    name: z.string(),
    images: z.array(z.string()).optional(),
    amount: z.number().min(50,{message:"Amount must be at least 50 i.e $$0.5"}).max(1000000,{message:"Amount must be at most 10000000 in cents i.e $100000"}),
    success_url: z.string().url(),
})
export const handler: APIGatewayProxyHandlerV2 = withErrorHandling(async (_event,ctx,callback) => {
    const pathParameters = assertNotNull(_event.pathParameters,"Missing path parameters");
    const projectId = parseProjectRegistryKey(pathParameters.projectId);
    const paymentId = parsePaymentRegistryId(pathParameters.paymentId);
    const paymentRegistry = PAYMENT_REGISTRY[paymentId];
    const stripeClient = new Stripe(paymentRegistry.apiKey)
    const body = bodySchema.parse(JSON.parse(_event.body ?? "{}"));
    const session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        success_url: body.success_url,
        line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  description: body.description,
                  name: body.name,
                  images: body.images,
                },
                unit_amount:
                  body.amount,
              },
              quantity: 1,
            },
        ],
    })

    return {
        body: JSON.stringify({
            projectId:projectId,
            paymentId:paymentId,
            url:session.url,
        }),
    }
});