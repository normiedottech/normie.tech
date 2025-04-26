"use client"

import { useState, useEffect } from "react"
import { AuthCard } from "@/components/referral/auth-card"
import { ReferralCard } from "@/components/referral/referral-card"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{
    phone: string
    referralLink: string
    rewards: number
    invitesRemaining: number
    inviteExpiry: Date
  } | null>(null)

  // Check if user is already authenticated (could use localStorage or cookies in a real app)
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (phone: string) => {
    // In a real app, this would be handled by your authentication service
    const mockUser = {
      phone,
      referralLink: `https://app.example.com/ref/${Math.random().toString(36).substring(2, 10)}`,
      rewards: Math.random() * 5 + 1, // Random reward between 1 and 6
      invitesRemaining: 5,
      inviteExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }

    setUser(mockUser)
    setIsAuthenticated(true)
    localStorage.setItem("user", JSON.stringify(mockUser))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <div className="max-w-md w-full">
        {!isAuthenticated ? <AuthCard onLogin={handleLogin} /> : <ReferralCard user={user!} onLogout={handleLogout} />}
      </div>
    </main>
  )
}
