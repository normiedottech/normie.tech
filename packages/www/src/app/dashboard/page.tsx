'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TransactionsTab from './transaction-tab'
import ComingSoonTab from './coming-soon-tab'
import CheckoutTab from './checkout-tab'
import PaymentLinkTab from './payment-link-tab'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("transactions")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-10">Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="checkout">Checkout Link</TabsTrigger>
          <TabsTrigger value="payment">Payment Link</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="checkout">
          <CheckoutTab />
        </TabsContent>
        <TabsContent value="payment">
          <PaymentLinkTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

