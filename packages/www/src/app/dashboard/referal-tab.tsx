"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from 'lucide-react';
import { useRouter } from "next/navigation";
import { DOMAIN } from "@/lib/constants";

export default function ReferralTab({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const referralLink = `${DOMAIN}/dashboard/sign-in?referral=${projectId}`;

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
    }
  };

  const handleReferralLeaderboard = () => {
    router.push("/leaderboard");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Referral Program</h2>
      <div className="flex items-center space-x-2">
        <Input
          value={referralLink}
          readOnly
          className="flex-grow"
        />
        <Button onClick={handleCopyReferralLink} variant="outline">
          {copied ? "Copied!" : <><Copy className="mr-2 h-4 w-4" /> Copy</>}
        </Button>
      </div>
      <p className="text-sm text-gray-500">
      Share this link to earn 20% commission of our platform fees for anyone who signs up through it. Rewards sent automatically to your payout address.
      </p>
      <Button onClick={handleReferralLeaderboard}>
        View Referral Leaderboard
      </Button>
    </div>
  );
}

