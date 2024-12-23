'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import TransactionChart from './transaction-chart';
import { components, normieTechClient } from '@/lib/normie-tech';

export default function TransactionsTab({ projectId, apiKey }: { projectId: string; apiKey: string }) {
  const [selectedTransaction, setSelectedTransaction] = useState<components['schemas']['TransactionWithPaymentUser'] | null>(null);

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ['transactions', projectId],
    queryFn: async () => {
      const response = await normieTechClient.GET('/v1/{projectId}/transactions', {
        params: {
          path: { projectId },
          header: { 'x-api-key': apiKey },
        },
      });

      if (response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch transactions');
      }
    },
  });

  // Filter and prepare data for the chart
  const chartData = transactions
    .filter(transaction => transaction.status === 'confirmed-onchain' || transaction.status === "fiat-confirmed"
    ) // Only include confirmed transactions
    .map(({ createdAt, amountInFiat }) => ({
      createdAt: createdAt || '',
      finalAmountInFiat: amountInFiat || 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Overview of your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : isError ? (
          <p>Error: {error.message}</p>
        ) : (
          <>
            <TransactionChart transactions={chartData} />
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
                    <TableCell>{transaction.amountInFiat}</TableCell>
                    <TableCell>{transaction.currencyInFiat}</TableCell>
                    <TableCell>{transaction.token}</TableCell>
                    <TableCell>{transaction.status}</TableCell>
                    <TableCell>{new Date(transaction.createdAt || '').toLocaleString()}</TableCell>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
