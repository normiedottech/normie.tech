"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Project } from "./actions/dashboard";

import TransactionsTab from "./transaction-tab";
import CheckoutTab from "./checkout-tab";
import PaymentLinkTab from "./payment-link-tab";
import ReferralTab from "./referal-tab";
import { toast } from "@/hooks/use-toast";

const truncateAddress = (address: string) => {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function Dashboard({
  project,
  apiKey,
}: {
 project: Project,
 apiKey: string;
}) {
  const [activeTab, setActiveTab] = useState("payment");
  const { data: session } = useSession();


  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: message,
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Dashboard</h1>
      
      <div className="mb-4 sm:mb-6 space-y-2">
        
        {project.payoutAddressOnEvm && (<div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Payout Address:</span>
          <span className="font-mono">{truncateAddress(project.payoutAddressOnEvm)}</span>
          <Button variant="ghost" size="sm" onClick={() => handleCopy(project.payoutAddressOnEvm ?? "", "Payout address copied to clipboard!")}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>)}
      </div>

      <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6 text-sm">
        <p>
          Current account has a limit on transaction volume. To increase your
          account transaction volumes, you can contact us{" "}
          <a
            href="https://normie.tech/#contact"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
        </p>
        <p>
          Our fees = <a
            href="https://stripe.com/pricing"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe fees
          </a> + 5%
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <TabsTrigger value="payment" className="w-full">Multi use links</TabsTrigger>
          <TabsTrigger value="checkout" className="w-full">Single use links</TabsTrigger>
          <TabsTrigger value="transactions" className="w-full">Transactions</TabsTrigger>
          <TabsTrigger value="referral" className="w-full">Referral</TabsTrigger>
        </TabsList>
        <TabsContent value="payment">
          <PaymentLinkTab apiKey={apiKey} projectId={project.projectId} />
        </TabsContent>
        <TabsContent value="checkout">
          <CheckoutTab projectId={project.projectId} apiKey={apiKey} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab projectId={project.projectId} apiKey={apiKey} />
        </TabsContent>
        <TabsContent value="referral">
          <ReferralTab projectId={project.projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

