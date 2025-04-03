"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { createWebhook, deleteWebhook, getWebhookDeliveries, updateWebhook, getWebhooks } from "../actions/webhooks";
import { WebhookEventType } from "../types/webhooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhooks, webhookDeliveries } from "@normietech/core/database/schema/index";

type Webhook = typeof webhooks.$inferSelect;
type WebhookDelivery = typeof webhookDeliveries.$inferSelect;

type WebhookUpdateData = {
  id: string;
  active?: boolean;
  generateNewSecret?: boolean;
};

export default function DevSettings() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isRenewingSecret, setIsRenewingSecret] = useState<Record<string, boolean>>({});
  const [copiedSecret, setCopiedSecret] = useState<Record<string, boolean>>({});
  const [newWebhook, setNewWebhook] = useState({
    endpoint: "",
    description: "",
    events: [] as WebhookEventType[],
  });

  const queryClient = useQueryClient();

  // Query for webhooks
  const { data: webhooksResponse, isLoading: isLoadingWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
     
      try {
        const response = await getWebhooks();
        
          return response;
       
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load webhooks");
        throw error;
      }
    },
  });

  // Query for webhook deliveries
  const { data: deliveriesResponse, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['webhookDeliveries', selectedWebhook?.id],
    queryFn: async () => {
      if (!selectedWebhook) return { success: true, data: [] };
      
      const toastId = toast.loading("Loading webhook deliveries...");
      try {
        const response = await getWebhookDeliveries(selectedWebhook.id);
        if (response.success) {
          toast.success("Deliveries loaded successfully", { id: toastId });
          return response;
        } else {
          toast.error(response.error || "Failed to load deliveries", { id: toastId });
          throw new Error(response.error);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load deliveries", { id: toastId });
        throw error;
      }
    },
    enabled: !!selectedWebhook,
  });

  // Mutation for creating webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (data: Parameters<typeof createWebhook>[0]) => {
      const toastId = toast.loading("Creating webhook...");
      try {
        const response = await createWebhook(data);
        if (response.success) {
          toast.success("Webhook created successfully", { id: toastId });
          return response;
        } else {
          toast.error(response.error || "Failed to create webhook", { id: toastId });
          throw new Error(response.error);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create webhook", { id: toastId });
        throw error;
      }
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        setIsCreating(false);
        setNewWebhook({
          endpoint: "",
          description: "",
          events: [],
        });
      }
    },
  });

  // Mutation for deleting webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const toastId = toast.loading("Deleting webhook...");
      try {
        const response = await deleteWebhook(id);
        if (response.success) {
          toast.success("Webhook deleted successfully", { id: toastId });
          return response;
        } else {
          toast.error(response.error || "Failed to delete webhook", { id: toastId });
          throw new Error(response.error);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete webhook", { id: toastId });
        throw error;
      }
    },
    onSuccess: (response, id) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        if (selectedWebhook?.id === id) {
          setSelectedWebhook(null);
        }
      }
    },
  });

  // Mutation for updating webhook
  const updateWebhookMutation = useMutation({
    mutationFn: async (data: WebhookUpdateData) => {
      const toastId = toast.loading("Updating webhook...");
      try {
        const response = await updateWebhook(data);
        if (response.success) {
          toast.success("Webhook updated successfully", { id: toastId });
          return response;
        } else {
          toast.error(response.error || "Failed to update webhook", { id: toastId });
          throw new Error(response.error);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update webhook", { id: toastId });
        throw error;
      }
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      }
    },
  });

  const handleCreateWebhook = async () => {
    createWebhookMutation.mutate(newWebhook);
  };

  const handleDeleteWebhook = async (id: string) => {
    deleteWebhookMutation.mutate(id);
  };

  const handleSelectWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    updateWebhookMutation.mutate({
      id: webhook.id,
      active: !webhook.active,
    });
  };

  const handleToggleSecret = (webhookId: string) => {
    setShowSecret(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }));
  };

  const handleCopySecret = async (webhookId: string, secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(prev => ({ ...prev, [webhookId]: true }));
      toast.success("Secret copied to clipboard");
      setTimeout(() => {
        setCopiedSecret(prev => ({ ...prev, [webhookId]: false }));
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy secret");
    }
  };

  const handleRenewSecret = async (webhook: Webhook) => {
    setIsRenewingSecret(prev => ({
      ...prev,
      [webhook.id]: false
    }));
    updateWebhookMutation.mutate({
      id: webhook.id,
      generateNewSecret: true,
    });
  };

  if (isLoadingWebhooks) {
    return <div>Loading webhooks...</div>;
  }

  const webhooks = webhooksResponse?.success ? webhooksResponse.data ?? [] : [];
  const deliveries = deliveriesResponse?.success ? deliveriesResponse.data ?? [] : [];

  return (
    <div className="flex gap-6">
      <div className="w-1/3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Endpoint URL</Label>
                  <Input
                    value={newWebhook.endpoint}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, endpoint: e.target.value })
                    }
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newWebhook.description}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="space-y-2">
                    {["transaction.pending", "transaction.onChainConfirmed", "transaction.fiatConfirmed"].map(
                      (event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <Checkbox
                            checked={newWebhook.events.includes(event as WebhookEventType)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event as WebhookEventType],
                                });
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter((e) => e !== event),
                                });
                              }
                            }}
                          />
                          <Label>{event}</Label>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <Button onClick={handleCreateWebhook}>Create Webhook</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer hover:bg-accent",
                  selectedWebhook?.id === webhook.id && "bg-accent"
                )}
                onClick={() => handleSelectWebhook(webhook)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{webhook.endpoint}</h3>
                    {webhook.description && (
                      <p className="text-sm text-muted-foreground">
                        {webhook.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWebhook(webhook);
                      }}
                    >
                      {webhook.active ? "Disable" : "Enable"}
                    </Button>
                    <Dialog open={isRenewingSecret[webhook.id]} onOpenChange={(open) => setIsRenewingSecret(prev => ({ ...prev, [webhook.id]: open }))}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRenewingSecret(prev => ({ ...prev, [webhook.id]: true }));
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Renew Secret
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Renew Webhook Secret</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to renew this webhook's secret? This will invalidate the current secret.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsRenewingSecret(prev => ({ ...prev, [webhook.id]: false }))}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRenewSecret(webhook)}
                          >
                            Renew Secret
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWebhook(webhook.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Secret:</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type={showSecret[webhook.id] ? "text" : "password"}
                        value={webhook.secret}
                        readOnly
                        className="h-7 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSecret(webhook.id);
                        }}
                      >
                        {showSecret[webhook.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySecret(webhook.id, webhook.secret);
                        }}
                      >
                        {copiedSecret[webhook.id] ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event: string) => (
                      <span
                        key={event}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="w-2/3">
        {selectedWebhook ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Webhook Deliveries</h2>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {isLoadingDeliveries ? (
                <div>Loading deliveries...</div>
              ) : (
                <div className="space-y-4">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{delivery.eventType}</span>
                        <span
                          className={cn(
                            "text-sm px-2 py-1 rounded",
                            delivery.successful
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {delivery.successful ? "Success" : "Failed"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </div>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto">
                        {JSON.stringify(delivery.payload, null, 2)}
                      </pre>
                      {!delivery.successful && delivery.error && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {delivery.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a webhook to view its deliveries
          </div>
        )}
      </div>
    </div>
  );
} 