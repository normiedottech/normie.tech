'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPayoutTransactions, getPayoutBalance, getPayoutSettings, initiatePayout,PayoutTransactions,PayoutBalance,PayoutSettings } from '@/app/dashboard/actions/payout'
import { toast } from "@/hooks/use-toast"



interface PayoutsTabProps {
  projectId: string
  apiKey: string
}

export function PayoutsTab({ projectId,apiKey }: PayoutsTabProps) {
  const [payoutTransactions, setPayoutTransactions] = useState<PayoutTransactions[]>([])
  const [payoutBalance, setPayoutBalance] = useState<PayoutBalance | null>(null)
  const [payoutSetting, setPayoutSetting] = useState<PayoutSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPayoutLoading, setIsPayoutLoading] = useState(false)

  useEffect(() => {
    const fetchPayoutData = async () => {
      setIsLoading(true)
      try {
        const transactions = await getPayoutTransactions()
        setPayoutTransactions(
           transactions
        )

        const balance = await getPayoutBalance()
        setPayoutBalance(balance)

        const settings = await getPayoutSettings()
        setPayoutSetting(settings)
      } catch (error) {
        console.error('Error fetching payout data:', error)
        toast({
          title: "Error",
          description: "Failed to fetch payout data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayoutData()
  }, [projectId])

  const handlePayout = async () => {
    setIsPayoutLoading(true)
    try {
     
      if(payoutSetting?.payoutPeriod === 'instant'){
        throw new Error('Instant payout done automatically to payout address , no need to click button')
      }
      if(payoutBalance?.balance === 0){
        throw new Error('Balance is ZERO')
      }
      const result = await initiatePayout(apiKey)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Refresh payout data after successful payout
      
      } else {
        throw new Error(result.message || 'Failed to initiate payout')
      }
    } catch (error) {
      console.error('Error initiating payout:', error)
      toast({
        title: "Error",
        description:((error as Error).message),
        variant: "destructive",
      })
    }
    finally {
      setIsPayoutLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading payout data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payouts</h2>
      
      </div>
   
      {payoutBalance && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Payout Balance</h3>
          <p>Available: {payoutBalance.balance.toFixed(2)} {payoutBalance.currency}</p>
          <p>Total Paid Out: {payoutBalance.paidOut.toFixed(2)} {payoutBalance.currency}</p>
        </div>
      )}

      {payoutSetting && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Payout Settings</h3>
          <p>Blockchain: {payoutSetting.blockchain.toLocaleUpperCase()}</p>
      
          <p className='text-sm'>Payout Address: {payoutSetting.payoutAddress}</p>
        </div>
      )}
         {payoutSetting && (
          <Button onClick={handlePayout}  disabled={payoutBalance?.balance === 0 || payoutSetting.payoutPeriod === 'instant' || isPayoutLoading}>
          {isPayoutLoading ? "Loading":`Payout to ${payoutSetting.blockchain.toLocaleUpperCase()}` } 
          </Button>
        )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Payout Transactions</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount(USD)</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Platform Fees(USD)</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payoutTransactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.amountInFiat.toFixed(2)} USD</TableCell>
                <TableCell>{transaction.onChainTransactionId || 'Pending'}</TableCell>
                <TableCell>{transaction.platFromFeesInFiat.toFixed(2)} USD</TableCell>
                <TableCell>{new Date(transaction.createdAt ?? new Date().toString()).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

