import { transactions } from '@normietech/core/database/schema/index';
import { format, parseISO } from 'date-fns';

export interface Transaction {
  id: string;
  projectId: string;
  paymentId: string;
  externalPaymentProviderId: string | null;
  chainId: number;
  blockchainTransactionId: string | null;
  paymentUserId: string | null;
  amountInFiat: number;
  currencyInFiat: string;
  token: string;
  decimals: number;
  tokenType: string;
  metadataJson: {
    payoutAddress?: string;
  };
  status: string;
  blockChainName: string;
  amountInToken: number;
  extraMetadata: Record<string, any>;
  paymentIntent: string | null;
  finalAmountInFiat: number;
  paymentProcessFeesInFiat: number;
  platformFeesInFiat: number;
  createdAt: string;
  updatedAt: string;
  referralFeesInFiat: number;
  referral: string | null;
}

export const processTransactions = (data: typeof transactions.$inferSelect[]) => {
  // Sort transactions by date
  const sortedData = [...data].sort((a, b) => new Date(a.createdAt ?? new Date()).getTime() - new Date(b.createdAt ?? new Date()).getTime());

  console.log({sortedData})
  // Process data for the line chart
  const lineChartData = sortedData.map(transaction => ({
    date: format(transaction.createdAt?.toDateString() ?? new Date().toDateString(), 'yyyy-MM-dd'),
    amount: transaction.amountInFiat,
    status: transaction.status
  }));

  // Process data for the pie chart
  const pieChartData = sortedData.reduce((acc, transaction) => {
    acc[transaction.status ?? "pending"] = (acc[transaction.status ?? "pending"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Process data for the bar chart (fees breakdown)
  const barChartData = sortedData.map(transaction => ({
    id: transaction.id,
    finalAmount: transaction.finalAmountInFiat,
    paymentProcessFees: transaction.paymentProcessFeesInFiat,
    platformFees: transaction.platformFeesInFiat,
    referralFees: transaction.referralFeesInFiat
  }));

  // Add a new chart for project-wise transaction count
  const projectTransactions = sortedData.reduce((acc, transaction) => {
    acc[transaction.projectId ?? "undefined"] = (acc[transaction.projectId ?? "undefined"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectChartData = Object.entries(projectTransactions).map(([project, count]) => ({
    project,
    count
  }));

  return { lineChartData, pieChartData, barChartData, projectChartData };
};

export const statusColors: Record<string, string> = {
  "pending": "#FFA500",
  "confirmed-onchain": "#4CAF50",
  "failed": "#F44336",
  "cancelled": "#9E9E9E",
  "refunded": "#2196F3",
  "fiat-confirmed": "#673AB7",
  "confirmed": "#009688",
  "other": "#795548"
};

