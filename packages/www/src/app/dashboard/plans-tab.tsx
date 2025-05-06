"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { createPlan } from "./actions/plan";
import { useMutation } from "@tanstack/react-query";


export default function PlansTab({ projectId, apiKey }: { projectId: string, apiKey: string }) {
  const [hasProductId, setHasProductId] = useState<"yes" | "no">("no");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImages, setProductImages] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productMetadata, setProductMetadata] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planInterval, setPlanInterval] = useState<"day" | "week" | "month" | "year">("month");
  const [planIntervalCount, setPlanIntervalCount] = useState("1");
  const [planMetadata, setPlanMetadata] = useState("");
  const [createdPlanUrl, setCreatedPlanUrl] = useState("");
  const { toast } = useToast();

const { mutate: handleCreatePlan, isPending: isCreatingPlan } = useMutation({
    mutationFn: async () => {
      const planData: any = {
        projectId,
        plan: {
          name: planName,
          description: planDescription,
          amount: parseInt(planAmount, 10),
          interval: planInterval,
          intervalCount: parseInt(planIntervalCount, 10),
          metadata: planMetadata ? JSON.parse(planMetadata) : undefined,
        },
      };

      if (hasProductId === "yes") {
        planData.productId = productId;
      } else {
        planData.product = {
          name: productName,
          description: productDescription,
          images: productImages ? productImages.split(",").map((img) => img.trim()) : [],
          category: productCategory,
          metadata: productMetadata ? JSON.parse(productMetadata) : undefined,
        };
      }

      return createPlan(planData, apiKey);
    },
    onSuccess: (result: any) => {
      setCreatedPlanUrl(result.url);
      toast({
        title: "Success",
        description: `Plan created! URL: ${result.url}`,
      });
      // Clear form
      setHasProductId("no");
      setProductId("");
      setProductName("");
      setProductDescription("");
      setProductImages("");
      setProductCategory("");
      setProductMetadata("");
      setPlanName("");
      setPlanDescription("");
      setPlanAmount("");
      setPlanInterval("month");
      setPlanIntervalCount("1");
      setPlanMetadata("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Subscription Plan</h2>

      <div className="space-y-4">
        <div>
          <Label>Do you have a Product ID?</Label>
          <RadioGroup
            value={hasProductId}
            onValueChange={(value: "yes" | "no") => setHasProductId(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {hasProductId === "yes" ? (
          <div>
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product ID"
              required
            />
          </div>
        ) : (
          <>
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
              <Label htmlFor="productDescription">Product Description</Label>
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product..."
              />
            </div>
            <div>
              <Label htmlFor="productImages">Product Images (comma-separated URLs)</Label>
              <Input
                id="productImages"
                value={productImages}
                onChange={(e) => setProductImages(e.target.value)}
                placeholder="https://example.com/image1.jpg,https://example.com/image2.jpg"
              />
            </div>
            <div>
              <Label htmlFor="productCategory">Product Category</Label>
              <Input
                id="productCategory"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="e.g., subscription"
              />
            </div>
            <div>
              <Label htmlFor="productMetadata">Product Metadata (JSON format)</Label>
              <Textarea
                id="productMetadata"
                value={productMetadata}
                onChange={(e) => setProductMetadata(e.target.value)}
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        )}

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
          <Label htmlFor="planDescription">Plan Description</Label>
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
            onChange={(e) => setPlanIntervalCount(e.target.value)}
            placeholder="1"
            required
          />
        </div>

        <div>
          <Label htmlFor="planMetadata">Plan Metadata (JSON format)</Label>
          <Textarea
            id="planMetadata"
            value={planMetadata}
            onChange={(e) => setPlanMetadata(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </div>

        <Button onClick={() => handleCreatePlan()} disabled={isCreatingPlan}>
          {isCreatingPlan ? "Creating..." : "Create Plan"}
        </Button>
      </div>

      {createdPlanUrl && (
        <div className="mt-4 p-4 bg-black-50 rounded-md">
          <p className="font-medium">Plan Created Successfully!</p>
          <p>
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
        </div>
      )}
    </div>
  );
}