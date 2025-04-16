"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function PaymentPage() {
  const [address, setAddress] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  const handleSave = () => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid USDC address",
        variant: "destructive",
      })
      return
    }

    // Generate a payment link (in a real app, this would be more complex)
    const link = `https://pay.example.com/${address}?fee=2`
    setPaymentLink(link)

    toast({
      title: "Success",
      description: "Payment link generated successfully",
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink)
    setIsCopied(true)
    toast({
      title: "Copied",
      description: "Payment link copied to clipboard",
    })

    // Reset the copy icon after 2 seconds
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-500 bg-gray-900 text-white">
        <CardHeader>
          {/* <CardTitle className="text-green-400">USDC Payment Generator</CardTitle> */}
          <CardTitle className="text-green-400">Generate a payment link for USDC on Base for receiving payment in zelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-300">
              USDC on Base Address
            </Label>
            <Input
              id="address"
              placeholder="Enter USDC address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
            <p className="text-gray-300 text-sm">
              Platform Fees: <span className="text-green-400 font-semibold">2%</span>
            </p>
          </div>

          {paymentLink && (
            <div className="space-y-2">
              <Label htmlFor="payment-link" className="text-gray-300">
                Payment Link
              </Label>
              <div className="flex">
                <Input
                  id="payment-link"
                  value={paymentLink}
                  readOnly
                  className="bg-gray-800 border-gray-700 text-white rounded-r-none"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="rounded-l-none border-l-0 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-green-400"
                >
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!paymentLink && (
            <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Save
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
