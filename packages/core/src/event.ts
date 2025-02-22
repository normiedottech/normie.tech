import { event } from 'sst/event'
import { ZodValidator } from 'sst/event/validator'
import { transactionSelectSchemaWithPaymentUser } from './database/schema'
import { z } from 'zod'
import { Resource } from 'sst'

export const metadataSquareSchema = z.object({
    metadataId: z.string().optional(),
    projectId: z.string(),
    paymentType: z.enum(['paymentLink', 'checkout']).default(
      'checkout'
    ),
    stage: z.string().default(Resource.App.stage)
})

export const metadataPaypalSchema = z.object({
    metadataId: z.string().optional(),
    projectId: z.string(),
    paymentType: z.enum(['paymentLink', 'checkout']).default(
      'checkout'
    ),
    stage: z.string().default(Resource.App.stage) 
})
const defineEvent = event.builder({
  validator: ZodValidator,
});
export const WebhookEvents = {
    Transaction:{
        Created: defineEvent("transaction.created",transactionSelectSchemaWithPaymentUser),
        OnChainConfirmed: defineEvent("transaction.onChainConfirmed",transactionSelectSchemaWithPaymentUser),
        FiatConfirmed: defineEvent("transaction.fiatConfirmed",transactionSelectSchemaWithPaymentUser),
    }
}

export const InternalEvents= {
    SquareUp:{
        OnChainTransactionConfirm: defineEvent("squareup.onChainTransactionConfirm",z.object({
            metadata:metadataSquareSchema,
            payment: z.any() 
        })),
    },
    PaymentCreated:{
        OnChain: defineEvent("paymentCreated.onChain",z.object({
            metadata: metadataOnchainPaymentCreated
        })),
    }
}
