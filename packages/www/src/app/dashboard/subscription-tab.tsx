"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllSubscriptions, cancelSubscription } from "./actions/subscription"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { getAllPlans } from "./actions/plan"

interface Plan {
  id: string
  name: string
  description: string
  amount: number
  interval: string
  intervalCount: number
  status: string
  product: {
    id: string
    name: string
    description: string
    imageUrl: string | null
  }
}

interface Subscription {
  id: string
  status: string
  planId: string
  currentPeriodStart: string
  currentPeriodEnd: string
  paymentUser: {
    id: string
    email: string
  }
}

interface SubscriptionTabProps {
  projectId: string
  apiKey: string
}

export default function SubscriptionTab({ projectId, apiKey }: SubscriptionTabProps) {
  const queryClient = useQueryClient()
  const { data: subscriptions = [], isLoading, isError, error } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const result = await getAllSubscriptions(apiKey)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.response
    },
    enabled: !!apiKey,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const result = await getAllPlans(apiKey)
      if (!result) {
        throw new Error("Failed to fetch plans")
      }
      return result
    },
    enabled: !!apiKey,
  })

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const result = await cancelSubscription(subscriptionId, apiKey)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.response
    },
    onMutate: () => {
      toast({
        title: "Cancelling subscription...",
        description: "Please wait while we process your request.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    },
  })

  const getPlanDetails = (planId: string) => {
    return plans.find((plan: Plan) => plan.id === planId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>Overview of your active subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading subscriptions...</p>
        ) : isError ? (
          <p>Error: {error.message}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscription ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription: Subscription) => {
                const plan = getPlanDetails(subscription.planId)
                return (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.id}</TableCell>
                    <TableCell>{plan?.name || "N/A"}</TableCell>
                    <TableCell>{plan ? `$${(plan.amount / 100).toFixed(2)}/${plan.interval}` : "N/A"}</TableCell>
                    <TableCell>{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}</TableCell>
                    <TableCell>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</TableCell>
                    <TableCell>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">View Details</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Subscription Details</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[600px]">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Subscription ID</div>
                                <div>{subscription.id}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Status</div>
                                <div>{subscription.status}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Start Date</div>
                                <div>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">End Date</div>
                                <div>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Plan Details</div>
                                <div>
                                  <pre className="whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Payment User Details</div>
                                <div>
                                  <pre className="whitespace-pre-wrap">{JSON.stringify(subscription.paymentUser, null, 2)}</pre>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      {subscription.status === "active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">Cancel</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this subscription? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, keep it</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate(subscription.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={cancelMutation.isPending}
                              >
                                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel it"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 