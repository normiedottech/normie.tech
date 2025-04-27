"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone } from "lucide-react"

interface AuthCardProps {
  onLogin: (data: { phone: string; email?: string; referredBy?: string }) => void
}

export function AuthCard({ onLogin }: AuthCardProps) {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [referredBy, setReferredBy] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate API call to send OTP
    setTimeout(() => {
      setOtpSent(true)
      setIsLoading(false)
    }, 1500)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate API call to verify OTP
    setTimeout(() => {
      onLogin({ phone, email, referredBy })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <Card className="w-full border-gray-800 bg-gray-900">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-xl font-bold text-white">Welcome</CardTitle>
        <CardDescription className="text-gray-400">
          {otpSent
            ? "Enter the OTP sent to your WhatsApp"
            : "Sign in with your phone number to access your referral dashboard"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!otpSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">
                Phone Number
              </Label>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-green-500" />
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  required
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email (optional)</Label>
                <Input
                  id="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referredBy" className="text-gray-300">Referral Code (optional)</Label>
              <Input
                id="referredBy"
                placeholder="Enter referral code"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-gray-300">
                WhatsApp OTP
              </Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4">
        {!otpSent ? (
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-black font-medium"
            onClick={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send WhatsApp OTP"
            )}
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-black font-medium"
              onClick={handleVerifyOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => {
                setOtpSent(false)
                setOtp("")
                setError("")
              }}
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
