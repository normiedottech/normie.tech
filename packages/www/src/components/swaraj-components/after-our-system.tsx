"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data showing average transaction times (in minutes) over number of requests
const transactionData = [
  { requests: 10, oldSystem: 4.2, normieTech: 1.8 },
  { requests: 20, oldSystem: 4.5, normieTech: 1.6 },
  { requests: 40, oldSystem: 4.7, normieTech: 1.4 },
  { requests: 70, oldSystem: 4.9, normieTech: 1.2 },
  { requests: 100, oldSystem: 5.0, normieTech: 1.0 },
]

export default function Component() {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>New User Onboarding Time Comparison</CardTitle>
        <CardDescription>Crypto (Old System with KYC) vs. NormieTech (New System) in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            oldSystem: {
              label: "Crypto (Old System)",
              color: "hsl(var(--chart-1))",
            },
            normieTech: {
              label: "NormieTech",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transactionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="requests" label={{ value: 'Number of Requests', position: 'insideBottom', offset: -5 }} />
              <YAxis domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5, 6]} label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="oldSystem"
                stroke="var(--color-oldSystem)"
                name="Crypto (Old System)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="normieTech"
                stroke="var(--color-normieTech)"
                name="NormieTech"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}