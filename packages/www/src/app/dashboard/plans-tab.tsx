"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from 'lucide-react';
import { useRouter } from "next/navigation";
import { DOMAIN } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { interval } from "date-fns";
import { Label } from "@/components/ui/label";
import { metadata } from "../layout";

export default function PlansTab({ projectId }: { projectId: string }) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [intervalCount, setIntervalCount] = useState("1");
    const [metadata, setMetadata] = useState("");
    const [createdPlanUrl, setCreatedPlanUrl] = useState("");


    const handleCreatePlan = async () => {}

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Subscription Plan</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monthly Subscription"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your plan..."
          />
        </div>

        <div>
          <Label htmlFor="amount">Amount (in cents)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            required
          />
        </div>

        <div>
          <Label htmlFor="interval">Billing Interval</Label>
          <Select value={interval} onValueChange={(value) => setInterval(value as typeof interval)}>
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
          <Label htmlFor="intervalCount">Interval Count</Label>
          <Input
            id="intervalCount"
            type="number"
            value={intervalCount}
            onChange={(e) => setIntervalCount(e.target.value)}
            placeholder="1"
            required
          />
        </div>

        <div>
          <Label htmlFor="metadata">Metadata (JSON format)</Label>
          <Textarea
            id="metadata"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </div>

        <Button onClick={handleCreatePlan}>
          Create Plan
        </Button>
      </div>

      {createdPlanUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium">Plan Created Successfully!</p>
          <p>
            URL:{' '}
            <a
              href={`https://${createdPlanUrl}`}
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
  )
}

