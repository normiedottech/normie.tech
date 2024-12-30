import { event } from 'sst/event'
import { ZodValidator } from 'sst/event/validator'
import { transactionSelectSchemaWithPaymentUser } from './database/schema'
const defineEvent = event.builder({
    validator: ZodValidator,
})
export const WebhookEvents = {
    Transaction:{
        Created: defineEvent("transaction.created",transactionSelectSchemaWithPaymentUser),
        OnChainConfirmed: defineEvent("transaction.onChainConfirmed",transactionSelectSchemaWithPaymentUser),
        FiatConfirmed: defineEvent("transaction.fiatConfirmed",transactionSelectSchemaWithPaymentUser),
    }
}