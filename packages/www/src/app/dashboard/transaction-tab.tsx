'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TransactionChart from './transaction-chart';
import { components, normieTechClient } from '@/lib/normie-tech';

export default function TransactionsTab({ projectId, apiKey }: { projectId: string; apiKey: string }) {
  const [selectedTransaction, setSelectedTransaction] = useState<components['schemas']['TransactionWithPaymentUser'] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ['transactions', projectId, itemsPerPage, currentPage],
    queryFn: async () => {
      const response = await normieTechClient.GET(`/v1/{projectId}/transactions`, {
        params: {
          path: { projectId },
          query: {
            limit: itemsPerPage,
            page: currentPage
          },
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

  // Filter transactions based on status
  const filteredTransactions = transactions.filter(transaction => {
    if (statusFilter === 'all') return true;
    return transaction.status === statusFilter;
  });

  const paginatedTransactions = filteredTransactions

  // Handle page changes
  const goToNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Filter and prepare data for the chart
  const chartData = filteredTransactions
    .filter(transaction => transaction.status === 'confirmed-onchain' || transaction.status === "fiat-confirmed")
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
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fiat-confirmed">Fiat Confirmed</SelectItem>
                  <SelectItem value="confirmed-onchain">On-Chain Confirmed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>

                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                {paginatedTransactions.map((transaction, index) => (
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Page {currentPage}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                // disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
