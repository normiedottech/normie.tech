'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import TransactionChart from './transaction-chart';
import { components, normieTechClient } from '@/lib/normie-tech';

// Monthly Volume Chart Component
const MonthlyVolumeChart = ({ data }: { data: Array<{ month: string; volume: number; count: number }> }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available for the selected period</div>;
  }

  const maxVolume = Math.max(...data.map(d => d.volume));
  
  return (
    <div className="space-y-4">
      <div className="h-64 flex items-end space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-blue-100 rounded-t relative group cursor-pointer">
              <div 
                className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ 
                  height: `${(item.volume / maxVolume) * 200}px`,
                  minHeight: '4px'
                }}
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${item.volume.toLocaleString()} ({item.count} transactions)
              </div>
            </div>
            <div className="text-xs mt-2 text-center font-medium">
              {item.month}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TransactionsTab({ projectId, apiKey }: { projectId: string; apiKey: string }) {
  const [selectedTransaction, setSelectedTransaction] = useState<components['schemas']['TransactionWithPaymentUser'] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Volume query states
  const [volumeStartDate, setVolumeStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().split('T')[0];
  });
  const [volumeEndDate, setVolumeEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [volumeStatus, setVolumeStatus] = useState<string>('confirmed');

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

  // Filter transactions based on status
  const filteredTransactions = transactions.filter(transaction => {
    if (statusFilter === 'all') return true;
    return transaction.status === statusFilter;
  });

  // Calculate monthly volume data
  const monthlyVolumeData = useMemo(() => {
    if (!transactions.length) return [];

    const startDate = new Date(volumeStartDate);
    const endDate = new Date(volumeEndDate);
    
    // Filter transactions based on date range and status
    const relevantTransactions = transactions.filter(transaction => {
      if (!transaction.createdAt) return false;
      
      const transactionDate = new Date(transaction.createdAt);
      const dateInRange = transactionDate >= startDate && transactionDate <= endDate;
      
      if (volumeStatus === 'confirmed') {
        return dateInRange && (transaction.status === 'confirmed-onchain' || transaction.status === 'fiat-confirmed');
      } else if (volumeStatus === 'all') {
        return dateInRange;
      } else {
        return dateInRange && transaction.status === volumeStatus;
      }
    });

    // Group by month
    const monthlyData: { [key: string]: { volume: number; count: number } } = {};
    
    relevantTransactions.forEach(transaction => {
      if (!transaction.createdAt || !transaction.amountInFiat) return;
      
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { volume: 0, count: 0 };
      }
      
      monthlyData[monthKey].volume += transaction.amountInFiat;
      monthlyData[monthKey].count += 1;
    });

    // Convert to array and sort
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }),
        volume: data.volume,
        count: data.count
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [transactions, volumeStartDate, volumeEndDate, volumeStatus]);

  // Calculate volume summary statistics
  const volumeSummary = useMemo(() => {
    const totalVolume = monthlyVolumeData.reduce((sum, item) => sum + item.volume, 0);
    const totalTransactions = monthlyVolumeData.reduce((sum, item) => sum + item.count, 0);
    const averageMonthlyVolume = monthlyVolumeData.length > 0 ? totalVolume / monthlyVolumeData.length : 0;
    const averageTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return {
      totalVolume,
      totalTransactions,
      averageMonthlyVolume,
      averageTransactionValue
    };
  }, [monthlyVolumeData]);

  // Calculate pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Handle page changes
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Filter and prepare data for the transaction chart
  const chartData = filteredTransactions
    .filter(transaction => transaction.status === 'confirmed-onchain' || transaction.status === "fiat-confirmed")
    .map(({ createdAt, amountInFiat }) => ({
      createdAt: createdAt || '',
      finalAmountInFiat: amountInFiat || 0,
    }));

  // Quick date range presets
  const setQuickDateRange = (months: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    setVolumeStartDate(startDate.toISOString().split('T')[0]);
    setVolumeEndDate(endDate.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Loading your transaction data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Error loading transaction data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error?.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Analytics</CardTitle>
          <CardDescription>Comprehensive view of your transaction data and volume trends</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Transaction Overview</TabsTrigger>
              <TabsTrigger value="volume">Monthly Volume Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
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
                    <SelectItem value="5">5 per page</SelectItem>
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
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'confirmed-onchain' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'fiat-confirmed' ? 'bg-blue-100 text-blue-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
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
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{endIndex} of {totalItems} transactions
                </div>
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
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="volume" className="space-y-6">
              {/* Volume Query Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Volume Query Settings
                  </CardTitle>
                  <CardDescription>
                    Configure date range and transaction status to analyze monthly volume trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={volumeStartDate}
                        onChange={(e) => setVolumeStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={volumeEndDate}
                        onChange={(e) => setVolumeEndDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Transaction Status</Label>
                      <Select value={volumeStatus} onValueChange={setVolumeStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed Only</SelectItem>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending Only</SelectItem>
                          <SelectItem value="fiat-confirmed">Fiat Confirmed</SelectItem>
                          <SelectItem value="confirmed-onchain">On-Chain Confirmed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quick Ranges</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setQuickDateRange(3)}>
                          3M
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setQuickDateRange(6)}>
                          6M
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setQuickDateRange(12)}>
                          1Y
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Volume Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Volume</p>
                        <p className="text-2xl font-bold">${volumeSummary.totalVolume.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                        <p className="text-2xl font-bold">{volumeSummary.totalTransactions.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Monthly Volume</p>
                        <p className="text-2xl font-bold">${volumeSummary.averageMonthlyVolume.toLocaleString()}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                        <p className="text-2xl font-bold">${volumeSummary.averageTransactionValue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Volume Trends</CardTitle>
                  <CardDescription>
                    Transaction volume breakdown by month for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyVolumeChart data={monthlyVolumeData} />
                </CardContent>
              </Card>

              {/* Monthly Volume Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Volume Details</CardTitle>
                  <CardDescription>Detailed breakdown of volume and transaction counts</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyVolumeData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Transaction Count</TableHead>
                          <TableHead>Average Transaction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyVolumeData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.month}</TableCell>
                            <TableCell>${item.volume.toLocaleString()}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>${(item.volume / item.count).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found for the selected criteria
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}