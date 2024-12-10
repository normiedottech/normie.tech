'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TransactionsTab from './transaction-tab'
import CheckoutTab from './checkout-tab'
import PaymentLinkTab from './payment-link-tab'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard({projectId, apiKey}: {projectId: string, apiKey: string}) {
  const [activeTab, setActiveTab] = useState("payment")
  const { data: session } = useSession()


 

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectId)
      alert("Project ID copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy Project ID:", error)
    }
  }

  const handleLogout = () => {
    signOut()
  }

  return (
    <div className="container mx-auto py-10 mt-12">
     
      <h1 className="text-4xl font-bold mb-10">Dashboard</h1>
      <div className="flex items-center space-x-4 mb-2">
          <span className="font-medium"><span>Current account has a limit on transaction volume. To increase your account transaction volumes, you can contact us </span>
        
            <a href="https://normie.tech/#contact" className="underline" target="_blank">here</a></span>
          
        </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
        <TabsTrigger value="payment">Payment Link</TabsTrigger>
         
          <TabsTrigger value="checkout">Checkout Link</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="payment">
          <PaymentLinkTab apiKey={apiKey} projectId={projectId} />
        </TabsContent>
        <TabsContent value="checkout">
          <CheckoutTab projectId={projectId} apiKey={apiKey} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab projectId={projectId} apiKey={apiKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
