const webhookEventBus = new sst.aws.Bus('WebhookEventBus')

webhookEventBus.subscribe("WebhookHandler",{
    handler:"packages/functions/src/events/webhook-handler.handler",
    link:[webhookEventBus]
})

export const outputs = {
    webhookEventBusUrn:webhookEventBus.urn,
    webhookEventBusName:webhookEventBus.name
}