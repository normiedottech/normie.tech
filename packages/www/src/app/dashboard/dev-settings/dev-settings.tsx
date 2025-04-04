"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, RefreshCw, Copy, Check, MoreHorizontal, Pencil, Save, X } from "lucide-react";
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
  endpoint?: string;
  events?: WebhookEventType[];
};

const truncateUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.length > 20 ? urlObj.pathname.slice(0, 20) + '...' : urlObj.pathname}`;
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '...' : url;
  }
};

export default function DevSettings() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isRenewingSecret, setIsRenewingSecret] = useState<Record<string, boolean>>({});
  const [copiedSecret, setCopiedSecret] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editingWebhook, setEditingWebhook] = useState<Record<string, { endpoint: string; events: WebhookEventType[] }>>({});
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
        if (response.success && response.data) {
          // Take only the latest 5 deliveries
          const latestDeliveries = response.data.slice(0, 5);
          toast.success("Deliveries loaded successfully", { id: toastId });
          return { ...response, data: latestDeliveries };
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
        if (response.success && response.data && 'id' in response.data) {
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
      if (response.success && response.data && 'id' in response.data) {
        queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        setIsEditing(prev => ({ ...prev, [response.data.id]: false }));
        setEditingWebhook(prev => {
          const newState = { ...prev };
          delete newState[response.data.id];
          return newState;
        });
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

  const handleStartEditing = (webhook: Webhook) => {
    setIsEditing(prev => ({ ...prev, [webhook.id]: true }));
    setEditingWebhook(prev => ({
      ...prev,
      [webhook.id]: {
        endpoint: webhook.endpoint,
        events: webhook.events as WebhookEventType[],
      }
    }));
  };

  const handleCancelEditing = (webhookId: string) => {
    setIsEditing(prev => ({ ...prev, [webhookId]: false }));
    setEditingWebhook(prev => {
      const newState = { ...prev };
      delete newState[webhookId];
      return newState;
    });
  };

  const handleSaveEdit = async (webhook: Webhook) => {
    const editedData = editingWebhook[webhook.id];
    if (!editedData) return;

    updateWebhookMutation.mutate({
      id: webhook.id,
      endpoint: editedData.endpoint,
      events: editedData.events,
    });
  };

  const handleEditEndpoint = (webhookId: string, value: string) => {
    setEditingWebhook(prev => ({
      ...prev,
      [webhookId]: {
        ...prev[webhookId],
        endpoint: value,
      }
    }));
  };

  const handleEditEvents = (webhookId: string, event: WebhookEventType, checked: boolean) => {
    setEditingWebhook(prev => ({
      ...prev,
      [webhookId]: {
        ...prev[webhookId],
        events: checked
          ? [...prev[webhookId].events, event]
          : prev[webhookId].events.filter(e => e !== event),
      }
    }));
  };

  if (isLoadingWebhooks) {
    return <div>Loading webhooks...</div>;
  }

  const webhooks = webhooksResponse?.success ? webhooksResponse.data ?? [] : [];
  const deliveries = deliveriesResponse?.success ? deliveriesResponse.data ?? [] : [];

  return (
    <div className="flex gap-6">
      <div className="w-1/2">
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
                  "p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedWebhook?.id === webhook.id && "bg-accent"
                )}
                onClick={() => handleSelectWebhook(webhook)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      webhook.active ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="font-mono text-sm">{truncateUrl(webhook.endpoint)}</span>
                  </div>
                  <Dialog 
                    open={showDetails[webhook.id]} 
                    onOpenChange={(open) => setShowDetails(prev => ({ ...prev, [webhook.id]: open }))}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Webhook Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Endpoint URL</Label>
                          <div className="flex items-center gap-2">
                            {isEditing[webhook.id] ? (
                              <Input
                                value={editingWebhook[webhook.id]?.endpoint || webhook.endpoint}
                                onChange={(e) => handleEditEndpoint(webhook.id, e.target.value)}
                                className="font-mono"
                              />
                            ) : (
                              <Input
                                value={webhook.endpoint}
                                readOnly
                                className="font-mono"
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySecret(webhook.id, webhook.endpoint);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {webhook.description && (
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={webhook.description}
                              readOnly
                            />
                          </div>
                        )}
                        <div>
                          <Label>Secret</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type={showSecret[webhook.id] ? "text" : "password"}
                              value={webhook.secret}
                              readOnly
                              className="font-mono"
                            />
                            <Button
                              variant="outline"
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
                              variant="outline"
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
                        <div>
                          <Label>Events</Label>
                          <div className="flex flex-wrap gap-2">
                            {["transaction.pending", "transaction.onChainConfirmed", "transaction.fiatConfirmed"].map(
                              (event) => (
                                <div key={event} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={isEditing[webhook.id]
                                      ? editingWebhook[webhook.id]?.events.includes(event as WebhookEventType)
                                      : webhook.events.includes(event as WebhookEventType)
                                    }
                                    onCheckedChange={(checked: boolean) => {
                                      if (isEditing[webhook.id]) {
                                        handleEditEvents(webhook.id, event as WebhookEventType, checked);
                                      }
                                    }}
                                    disabled={!isEditing[webhook.id]}
                                  />
                                  <Label>{event}</Label>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex gap-2">
                            {isEditing[webhook.id] ? (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(webhook);
                                  }}
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEditing(webhook.id);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditing(webhook);
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Details
                              </Button>
                            )}
                            <Button
                              variant={webhook.active ? "destructive" : "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWebhook(webhook);
                              }}
                            >
                              {webhook.active ? "Disable" : "Enable"}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Dialog open={isRenewingSecret[webhook.id]} onOpenChange={(open) => setIsRenewingSecret(prev => ({ ...prev, [webhook.id]: open }))}>
                              <DialogTrigger asChild>
                                <Button variant="outline">
                                  <RefreshCw className="w-4 h-4 mr-2" />
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsRenewingSecret(prev => ({ ...prev, [webhook.id]: false }));
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRenewSecret(webhook);
                                    }}
                                  >
                                    Renew Secret
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWebhook(webhook.id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="w-1/2">
        {selectedWebhook ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Latest Deliveries</h2>
              <span className="text-sm text-muted-foreground">Showing last 5 deliveries</span>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {isLoadingDeliveries ? (
                <div>Loading deliveries...</div>
              ) : (
                <div className="space-y-4">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            delivery.successful ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="font-medium">{delivery.eventType}</span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Delivery Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Event Type</Label>
                                <div className="font-mono bg-muted p-2 rounded-md break-all">
                                  {delivery.eventType}
                                </div>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <div className={cn(
                                  "font-mono bg-muted p-2 rounded-md",
                                  delivery.successful ? "text-green-600" : "text-red-600"
                                )}>
                                  {delivery.successful ? "Success" : "Failed"}
                                </div>
                              </div>
                              <div>
                                <Label>Created At</Label>
                                <div className="font-mono bg-muted p-2 rounded-md">
                                  {new Date(delivery.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <Label>Payload</Label>
                                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                                  {JSON.stringify(delivery.payload, null, 2)}
                                </pre>
                              </div>
                              {!delivery.successful && delivery.error && (
                                <div>
                                  <Label>Error</Label>
                                  <div className="font-mono bg-muted p-2 rounded-md text-red-600 break-all">
                                    {delivery.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </div>
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