"use client";

import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const onrampData = [
  { name: "Failed Attempts", value: 78 },
  { name: "Successful Attempts", value: 22 },
];

const userData = [
  { name: "Lost Users", value: 78 },
  { name: "Onboarded Users", value: 22 },
];

const COLORS = ["hsl(var(--destructive))", "hsl(var(--primary))"];

export const CryptoOnboardingAnalysis = () => {
  return (
    <Card className="w-full max-w-fit px-[5rem] max-[565px]:px-[1rem] border-none">
      <CardHeader>
        <CardTitle className="text-5xl font-bold bricolage-fonts">
          Crypto Onboarding Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Onramp Attempt Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={onrampData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {onrampData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <p className="text-sm text-center mt-4 text-muted-foreground">
              78% of onramp attempts fail, presenting a significant challenge
              for user acquisition.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Onboarding Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {userData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <p className="text-sm text-center mt-4 text-muted-foreground">
              Only 22% of users successfully complete the onboarding process,
              resulting in a high user loss rate.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};