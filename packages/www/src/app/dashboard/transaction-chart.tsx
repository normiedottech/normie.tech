'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function TransactionChart({ transactions  }:{transactions:[{createdAt:string,finalAmountInFiat:number}]}) {
  const chartData = transactions.map(t => ({
    date: new Date(t.createdAt).toLocaleDateString(),
    amount: t.finalAmountInFiat
  }))

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Transaction Amount Over Time</CardTitle>
        <CardDescription>Final amount in fiat currency</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="#000000" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

