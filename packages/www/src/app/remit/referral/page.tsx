"use client"

import { useState, useEffect } from "react"
import { AuthCard } from "@/components/referral/auth-card"
import { ReferralCard } from "@/components/referral/referral-card"
import { createReferral, getReferralDetails, getTotalReferredUsers } from "@/app/dashboard/actions/referrals"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<{
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
  } | null>(null)

  // Check if user is already authenticated (could use localStorage or cookies in a real app)
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (data: { phone: string; email?: string; referredBy?: string }) => {
    const result = await createReferral(data)
    if (result.success) {
      const detailsResult = await getReferralDetails()
      const referredCountResult = await getTotalReferredUsers(data.phone)
      if (detailsResult.success && detailsResult.data) {
        setUser({
          ...detailsResult.data,
          referredCount: referredCountResult.data || 0,
        })
        localStorage.setItem("userPhone", data.phone)
        setIsAuthenticated(true)
      } else {
        setError("Failed to fetch referral details")
      }
    } else {
      setError(result.error || "Failed to create referral")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <div className="max-w-md w-full">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!isAuthenticated ? <AuthCard onLogin={handleLogin} /> : <ReferralCard user={user!} onLogout={handleLogout} />}
      </div>
    </main>
  )
}
