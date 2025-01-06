"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Menu } from "lucide-react";
import { Project } from "./actions/dashboard"

import TransactionsTab from "./transaction-tab";
import CheckoutTab from "./checkout-tab";
import PaymentLinkTab from "./payment-link-tab";
import ReferralTab from "./referal-tab";
import { toast } from "@/hooks/use-toast";
import { PayoutsTab } from "@/app/dashboard/payout-tab";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SettingsTab } from "./settings-tab";

const truncateAddress = (address: string) => {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const tabs = [
  { value: "payment", label: "Recurring Link" },
  { value: "checkout", label: "One-time link" },
  { value: "transactions", label: "Transactions" },
  { value: "referral", label: "Referral" },
  { value: "payout", label: "Payout" },
  { value: "settings", label: "Settings" },
];

export default function Dashboard({
  project,
  apiKey,
}: {
  project: Project;
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
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      <div className="items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-2 md:mb-0">
        <span className="font-medium">Project ID:</span>
        <div className="flex items-center space-x-2">
          <span className="font-mono py-1 rounded text-sm">
            {project.projectId}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleCopy(project.projectId, "Project ID copied to clipboard!")
            }
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          Dashboard
        </h1>
        <>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col space-y-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant="ghost"
                    className={cn(
                      "justify-start",
                      activeTab === tab.value && "bg-muted font-semibold"
                    )}
                    onClick={() => setActiveTab(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full md:w-auto font-semibold"
                >
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-8">
        <aside className="w-full md:w-64 mb-6 md:mb-0">
          <nav className="hidden md:flex flex-col space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                className={`justify-start ${activeTab === tab.value ? "bg-muted font-semibold" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
              <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full md:w-auto font-semibold"
                >
                  Logout
                </Button>
          </nav>

          <div className="mt-8 space-y-4">
            
            <div className="text-sm space-y-2">
              <p>
                Current account has a limit on transaction volume. To increase
                your account transaction volumes, you can contact us{" "}
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
                Our fees ={" "}
                <a
                  href="https://stripe.com/pricing"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe fees
                </a>{" "}
                + 5%
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <Tabs value={activeTab} className="space-y-4">
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
            <TabsContent value="payout">
              <PayoutsTab projectId={project.projectId} apiKey={apiKey} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab projectId={project.projectId} initialApiKey={apiKey} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
