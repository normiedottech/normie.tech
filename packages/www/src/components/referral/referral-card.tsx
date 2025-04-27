"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface ReferralCardProps {
  user: {
    referralId: string
    email: string | null
    phone: string | null
    referredBy: string | null
    totalAmountPassed: number
    amountEarned: number
    amountClaimed: number
    createdAt: Date | null
    updatedAt: Date | null
    referredCount: number
  }
  onLogout: () => void
}


export function ReferralCard({ user, onLogout }: ReferralCardProps) {
  const [walletAddress, setWalletAddress] = useState("")
  const [isClaiming, setIsClaiming] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [claimError, setClaimError] = useState("")
  const [claimSuccess, setClaimSuccess] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(user.referralId)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClaim = () => {
    if (!walletAddress || walletAddress.length < 10) {
      setClaimError("Please enter a valid wallet address")
      return
    }

    if (user.amountEarned < 1) {
      setClaimError("You need at least $1 in rewards to claim")
      return
    }

    setIsClaiming(true)
    setClaimError("")

    // Simulate API call to claim rewards
    setTimeout(() => {
      setIsClaiming(false)
      setClaimSuccess(true)
      setTimeout(() => setClaimSuccess(false), 3000)
    }, 2000)
  }

  // const daysLeft = Math.ceil((new Date(user.inviteExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="w-full border-gray-800 bg-gray-900">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-xl font-bold text-white">Your Referral Dashboard</CardTitle>
        <CardDescription className="text-gray-400">
          Invite friends and earn rewards on their transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Tabs defaultValue="referral">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="referral" className="data-[state=active]:bg-green-600 data-[state=active]:text-black">
              Referral Link
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-green-600 data-[state=active]:text-black">
              Claim Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referral" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Your Referral Id</Label>
              <div className="flex items-center space-x-2">
                <Input value={user.referralId} readOnly className="bg-gray-800 border-gray-700 text-white" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0 border-gray-700 bg-gray-800 hover:bg-gray-700"
                >
                  {isCopied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-400">Share this link with friends to earn rewards</p>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                (user.referredCount &gt; 5 ? (
                  <span className="text-sm font-medium text-gray-300">you have {user.referredCount} referred users</span>
                ) : (
                  <span className="text-sm font-medium text-gray-300">Invites Remaining to start earning</span>
                <span className="font-bold text-green-500">{user.referredCount}/5</span>
                ))
              </div>
              {/* <div className="flex items-center space-x-2 text-sm text-yellow-500">
                <Clock className="h-4 w-4" />
                <span>Expires in {daysLeft} days</span>
              </div> */}
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 space-y-3">
              <h3 className="font-medium text-white">Referral Rewards Schedule</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between">
                  <span>First 30 days:</span>
                  <span className="font-medium text-green-500">0.5% of transaction volume</span>
                </li>
                <li className="flex justify-between">
                  <span>Days 31-90:</span>
                  <span className="font-medium text-green-500">0.25% of transaction volume</span>
                </li>
                <li className="flex justify-between">
                  <span>Days 91-270:</span>
                  <span className="font-medium text-green-500">0.1% of transaction volume</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4 mt-4">
            <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Rewards Ready to Claim</h3>
                <p className="text-sm text-gray-400">Minimum $1 to claim</p>
              </div>
              <span className="text-2xl font-bold text-green-500">${user.amountEarned.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet" className="text-gray-300">
                Wallet Address
              </Label>
              <Input
                id="wallet"
                placeholder="Enter your wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
              />
              {claimError && (
                <div className="flex items-center space-x-1 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{claimError}</span>
                </div>
              )}
              {claimSuccess && (
                <div className="flex items-center space-x-1 text-sm text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <span>Rewards claimed successfully!</span>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-black font-medium"
              onClick={handleClaim}
              disabled={isClaiming || user.amountEarned < 1}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Claim Rewards"
              )}
            </Button>

            {user.amountEarned < 1 && (
              <p className="text-sm text-center text-gray-400">You need at least $1 in rewards to claim</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Sign Out
        </Button>
        <p className="text-xs text-gray-500">Terms and conditions apply</p>
      </CardFooter>
    </Card>
  )
}
