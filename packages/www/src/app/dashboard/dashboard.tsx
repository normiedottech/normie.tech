"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const checkScrollPosition = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Dashboard</h1>
      
      <div className="mb-4 sm:mb-6 space-y-2">
        {project.payoutAddressOnEvm && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Payout Address:</span>
            <span className="font-mono">{truncateAddress(project.payoutAddressOnEvm)}</span>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(project.payoutAddressOnEvm ?? "", "Payout address copied to clipboard!")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
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
      <div className="relative mt-6">
          {showLeftArrow && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
              onClick={() => scrollTabs('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {showRightArrow && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
              onClick={() => scrollTabs('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <div 
            ref={tabsRef}
            className="overflow-x-auto scrollbar-hide"
            onScroll={checkScrollPosition}
          >
            <TabsList className="inline-flex w-max border-b border-gray-200 dark:border-gray-700">
              <TabsTrigger value="payment" className="px-4 py-2 text-sm font-medium">Multi use links</TabsTrigger>
              <TabsTrigger value="checkout" className="px-4 py-2 text-sm font-medium">Single use links</TabsTrigger>
              <TabsTrigger value="transactions" className="px-4 py-2 text-sm font-medium">Transactions</TabsTrigger>
              <TabsTrigger value="referral" className="px-4 py-2 text-sm font-medium">Referral</TabsTrigger>
            </TabsList>
          </div>
        </div>
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

