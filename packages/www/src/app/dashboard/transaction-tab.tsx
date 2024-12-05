'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import TransactionChart from './transaction-chart'

// Dummy data for transactions
const transactions = [
  {
    projectId: "proj_123",
    paymentId: "pay_456",
    externalPaymentProviderId: "ext_789",
    chainId: 10,
    blockChainName: "evm",
    blockchainTransactionId: "0x123...789",
    amountInFiat: 100.50,
    currencyInFiat: "USD",
    finalAmountInFiat: 95.25,
    paymentProcessFeesInFiat: 3.25,
    platformFeesInFiat: 2.00,
    token: "USDC",
    amountInToken: 95.25,
    decimals: 6,
    tokenType: "TOKEN",
    paymentIntent: "pi_1234567890",
    metadataJson: { customer: "John Doe", product: "Premium Plan" },
    extraMetadataJson: { referral: "Jane Smith" },
    status: "completed",
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-06-15T10:35:00Z",
  },
  // Add more dummy transactions here...
]

export default function TransactionsTab() {
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[number]>()
  const chartData =  transactions.map(({ createdAt, finalAmountInFiat }) => ({ createdAt, finalAmountInFiat }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Overview of your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionChart transactions={chartData as any} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.projectId}</TableCell>
                <TableCell>{transaction.finalAmountInFiat}</TableCell>
                <TableCell>{transaction.currencyInFiat}</TableCell>
                <TableCell>{transaction.token}</TableCell>
                <TableCell>{transaction.status}</TableCell>
                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedTransaction(transaction)}>
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[800px]">
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[600px]">
                        {selectedTransaction && (
                          <div className="space-y-4">
                            {Object.entries(selectedTransaction).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">{key}</div>
                                <div>
                                  {typeof value === 'object' ? (
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

