'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { processTransactions, statusColors, Transaction } from '@/utilts/data-processing';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '@/actions/graph';



export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState('all');
  const {data} = useQuery({
    initialData:[],
    queryKey:['transactions'],
    queryFn: async () => {
      const response = await getTransactions();
      return response;
    }
  })
  
  const { lineChartData, pieChartData, barChartData, projectChartData } = useMemo(() => processTransactions(data), [data]);
  console.log({lineChartData, pieChartData, barChartData, projectChartData})
  const filteredLineChartData = useMemo(() => 
    statusFilter === 'all' 
      ? lineChartData 
      : lineChartData.filter(item => item.status === statusFilter),
    [lineChartData, statusFilter]
  );

  const pieChartDataArray = Object.entries(pieChartData).map(([name, value]) => ({ name, value }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Transaction Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Project-wise Transaction Count</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Amount Over Time</CardTitle>
            <CardDescription>
              <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.keys(statusColors).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredLineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartDataArray}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartDataArray.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || statusColors.other} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Fee Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="finalAmount" stackId="a" fill="#8884d8" />
              <Bar dataKey="paymentProcessFees" stackId="a" fill="#82ca9d" />
              <Bar dataKey="platformFees" stackId="a" fill="#ffc658" />
              <Bar dataKey="referralFees" stackId="a" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

