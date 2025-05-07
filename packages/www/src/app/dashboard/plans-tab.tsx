"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createPlan, getAllPlans, getPlan, deletePlan } from "./actions/plan";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, ChevronDown, Plus, Trash2, ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/hexta-ui/Tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOMAIN } from "@/lib/constants";

export default function PlansTab({ projectId, apiKey }: { projectId: string, apiKey: string }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productMetadata, setProductMetadata] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planInterval, setPlanInterval] = useState<"day" | "week" | "month" | "year">("month");
  const [planIntervalCount, setPlanIntervalCount] = useState("1");
  const [planMetadata, setPlanMetadata] = useState("");
  const [createdPlanUrl, setCreatedPlanUrl] = useState("");

  // Fetch all plans
  const { data: plans, refetch: refetchPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getAllPlans(apiKey),
  });

  // Fetch single plan
  const { data: selectedPlan, isLoading: isLoadingPlanDetails } = useQuery({
    queryKey: ['plan', selectedPlanId],
    queryFn: () => selectedPlanId ? getPlan(selectedPlanId, apiKey) : null,
    enabled: !!selectedPlanId,
  });

  // Create plan mutation
  const { mutate: handleCreatePlan, isPending: isCreatingPlan } = useMutation({
    mutationFn: async () => {
      const planData: any = {
        projectId,
        product: {
          name: productName,
          description: productDescription || undefined,
          images: productImage ? [productImage.trim()] : [],
          category: productCategory || undefined,
          metadata: productMetadata ? JSON.parse(productMetadata) : undefined,
        },
        plan: {
          name: planName,
          description: planDescription || undefined,
          amount: parseInt(planAmount, 10),
          interval: planInterval,
          intervalCount: parseInt(planIntervalCount, 10),
          metadata: planMetadata ? JSON.parse(planMetadata) : undefined,
        },
      };

      return createPlan(planData, apiKey);
    },
    onSuccess: (result: any) => {
      setCreatedPlanUrl(result.url);
      toast({
        title: "Success",
        description: "Plan created successfully!",
      });
      refetchPlans();
      // Don't clear form or close modal yet - let user see the URL
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const { mutate: handleDeletePlan, isPending: isDeletingPlan } = useMutation({
    mutationFn: async (planId: string) => {
      return deletePlan(planId, apiKey);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      refetchPlans();
      setPlanToDelete(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setProductImage("");
    setProductCategory("");
    setProductMetadata("");
    setPlanName("");
    setPlanDescription("");
    setPlanAmount("");
    setPlanInterval("month");
    setPlanIntervalCount("1");
    setPlanMetadata("");
    setCreatedPlanUrl("");
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Product Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Product Details</h3>
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Subscription Product"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productDescription">Product Description (Optional)</Label>
                  <Textarea
                    id="productDescription"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your product..."
                  />
                </div>
                <div>
                  <Label htmlFor="productImage">Product Image URL (Optional)</Label>
                  <Input
                    id="productImage"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="productCategory">Product Category (Optional)</Label>
                  <Input
                    id="productCategory"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="e.g., subscription"
                  />
                </div>
                <div>
                  <Label htmlFor="productMetadata">Product Metadata (JSON format, Optional)</Label>
                  <Textarea
                    id="productMetadata"
                    value={productMetadata}
                    onChange={(e) => setProductMetadata(e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>

              {/* Plan Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Plan Details</h3>
                <div>
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Monthly Subscription"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="planDescription">Plan Description (Optional)</Label>
                  <Textarea
                    id="planDescription"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    placeholder="Describe your plan..."
                  />
                </div>
                <div>
                  <Label htmlFor="planAmount">Amount (in cents)</Label>
                  <Input
                    id="planAmount"
                    type="number"
                    value={planAmount}
                    onChange={(e) => setPlanAmount(e.target.value)}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="planInterval">Billing Interval</Label>
                  <Select value={planInterval} onValueChange={(value) => setPlanInterval(value as typeof planInterval)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planIntervalCount">Interval Count</Label>
                  <Input
                    id="planIntervalCount"
                    type="number"
                    value={planIntervalCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 365) {
                        setPlanIntervalCount(e.target.value);
                      }
                    }}
                    min="1"
                    max="365"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="planMetadata">Plan Metadata (JSON format, Optional)</Label>
                  <Textarea
                    id="planMetadata"
                    value={planMetadata}
                    onChange={(e) => setPlanMetadata(e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>

              {createdPlanUrl ? (
                <div className="p-4 bg-black-50 rounded-md">
                  <p className="font-medium">Plan Created Successfully!</p>
                  <p className="mt-2">
                    URL:{" "}
                    <a
                      href={createdPlanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {createdPlanUrl}
                    </a>
                  </p>
                  <Button onClick={handleCloseCreateModal} className="mt-4">
                    Close
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={handleCloseCreateModal}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleCreatePlan()} disabled={isCreatingPlan}>
                    {isCreatingPlan ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingPlans ? (
          <div className="col-span-full flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : plans?.map((plan: any) => (
          <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  ${(plan.amount / 100).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">
                    /{plan.interval}
                  </span>
                </p>
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setPlanToDelete(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Details Dialog */}
      <Dialog open={!!selectedPlanId} onOpenChange={(open) => !open && setSelectedPlanId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan Details</DialogTitle>
          </DialogHeader>
          {isLoadingPlanDetails ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedPlan && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Product</h3>
                <p>Name: {selectedPlan.product.name}</p>
                <p>Description: {selectedPlan.product.description || 'N/A'}</p>
                {selectedPlan.product.imageUrl && (
                  <img
                    src={selectedPlan.product.imageUrl}
                    alt={selectedPlan.product.name}
                    className="w-32 h-32 object-cover mt-2"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Plan</h3>
                <p>Name: {selectedPlan.name}</p>
                <p>Description: {selectedPlan.description || 'N/A'}</p>
                <p>Amount: ${(selectedPlan.amount / 100).toFixed(2)}</p>
                <p>Interval: {selectedPlan.interval}</p>
                <p>Interval Count: {selectedPlan.intervalCount}</p>
                <p>Status: {selectedPlan.status}</p>
                <p>Plan ID: {selectedPlan.id}</p>
                <p className="mt-2">
                  Checkout URL:{" "}
                  <a
                    href={`${DOMAIN}/checkout/subscription/${selectedPlan.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open Checkout
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlanId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && handleDeletePlan(planToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingPlan}
            >
              {isDeletingPlan ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}