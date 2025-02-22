"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getPayoutTransactions,
  getPayoutBalance,
  getPayoutSettings,
  initiatePayout,
  PayoutTransactions,
  PayoutBalance,
  PayoutSettings,
} from "@/app/dashboard/actions/payout"
import { toast } from "@/hooks/use-toast"
import { useMemo } from "react"

interface PayoutsTabProps {
  projectId: string
  apiKey: string
}

export function PayoutsTab({ projectId, apiKey }: PayoutsTabProps) {
  const queryClient = useQueryClient()

  // 1. Fetch: Payout Transactions
  const {
    data: payoutTransactions = [],
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
  } = useQuery<PayoutTransactions[], Error>({
    queryKey: ["payoutTransactions", projectId],
    queryFn: () => getPayoutTransactions(),
    // You can configure staleTime, refetch intervals, etc. here
    staleTime: 1000 * 30, // 30s
  })

  // 2. Fetch: Payout Balance
  const {
    data: payoutBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError,
  } = useQuery<PayoutBalance, Error>({
    queryKey: ["payoutBalance", projectId],
    queryFn: () => getPayoutBalance(),
    staleTime: 1000 * 30,
  })

  // 3. Fetch: Payout Settings
  const {
    data: payoutSetting,
    isLoading: isSettingLoading,
    isError: isSettingError,
    error: settingError,
  } = useQuery<PayoutSettings, Error>({
    queryKey: ["payoutSettings", projectId],
    queryFn: () => getPayoutSettings(),
    staleTime: 1000 * 30,
  })

  // 4. Mutation: Initiate Payout
  const { mutate: handlePayoutMutation, isPending: isPayoutLoading } = useMutation({
    mutationFn: () => initiatePayout(apiKey),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({
          queryKey: ["payoutTransactions", projectId],
        })
        queryClient.invalidateQueries({
          queryKey: ["payoutBalance", projectId],
        })
      } else {
        throw new Error(result.message || "Failed to initiate payout")
      }
    },
    onError: (err) => {
      console.error("Error initiating payout:", err)
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      })
    },
  })

  // Combine loading states
  const isLoadingAll = isTransactionsLoading || isBalanceLoading || isSettingLoading
  // Combine error states
  const isErrorAny = isTransactionsError || isBalanceError || isSettingError

  // Combine error messages
  const errorMessage = useMemo(() => {
    if (isTransactionsError) return transactionsError?.message
    if (isBalanceError) return balanceError?.message
    if (isSettingError) return settingError?.message
    return null
  }, [isTransactionsError, transactionsError, isBalanceError, balanceError, isSettingError, settingError])

  // Payout action
  const handlePayout = () => {
    // Additional local checks
    if (payoutSetting?.payoutPeriod === "instant") {
      toast({
        title: "Error",
        description:
          "Instant payout is done automatically to the payout address; no need to click a button.",
        variant: "destructive",
      })
      return
    }
    if (payoutBalance?.balance === 0) {
      toast({
        title: "Error",
        description: "Balance is ZERO",
        variant: "destructive",
      })
      return
    }

    // Trigger the mutation
    handlePayoutMutation()
  }

  // Show loading state
  if (isLoadingAll) {
    return <div>Loading payout data...</div>
  }

  // Show error state
  if (isErrorAny) {
    return (
      <div className="text-red-500">
        <p>Error loading payout data:</p>
        <p>{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
    <h2 className="text-2xl font-bold">Payouts</h2>

    {payoutSetting && (
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Payout Settings</h3>
        <p>Blockchain: {payoutSetting.blockchain.toLocaleUpperCase()}</p>
        <p className="text-lg ">Payout Address: {payoutSetting.payoutAddress}</p>
        {payoutSetting.blockchain.toLowerCase().includes("tron") && (
            <p className="text-sm text-red-500 mt-2">
              Note: A $10 fee applies to each payout on the Tron blockchain.
            </p>
          )}
      </div>
    )}

    {payoutSetting?.payoutPeriod !== "instant" && (
      <>
        {payoutBalance && (
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Payout Balance</h3>
            <p>
              Available: {payoutBalance.balance.toFixed(2)}{" "}
              {payoutBalance.currency}
            </p>
            <p>
              Total Paid Out: {payoutBalance.paidOut.toFixed(2)}{" "}
              {payoutBalance.currency}
            </p>
          </div>
        )}

        <Button
          onClick={handlePayout}
          disabled={
            payoutBalance?.balance === 0 ||
          
            isPayoutLoading
          }
        >
          {isPayoutLoading
            ? "Processing..."
            : `Payout to ${payoutSetting?.blockchain.toLocaleUpperCase()}`}
        </Button>

        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Payout Transactions</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {transaction.amountInFiat.toFixed(2)} USD
                  </TableCell>
                  <TableCell>
                    {transaction.onChainTransactionId || "Pending"}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      transaction.createdAt ?? new Date().toString()
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )}
  </div>
  )
}
