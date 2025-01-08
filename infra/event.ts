export const webhookEventBus = new sst.aws.Bus('WebhookEventBus')

webhookEventBus.subscribe("WebhookHandler",{
    handler:"packages/functions/src/events/webhook-handler.handler",
    link:[webhookEventBus]
})

export const internalEventBus = new sst.aws.Bus('InternalEventBus')

internalEventBus.subscribe("EventHandler",{
    handler:"packages/functions/src/events/event-handler.handler",
    link:[internalEventBus]
})
export const outputs = {
    webhookEventBusUrn:webhookEventBus.urn,
    webhookEventBusName:webhookEventBus.name,
    internalEventBusUrn:internalEventBus.urn,
    internalEventBusName:internalEventBus.name,
}