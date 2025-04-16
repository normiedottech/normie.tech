"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface CheckoutZellePaymentProps {
  transactionId: string
  amount: number
  successUrl?: string
  isLightMode?: boolean
}

export function CheckoutZellePayment({
  transactionId,
  amount,
  successUrl,
  isLightMode = false,
}: CheckoutZellePaymentProps) {
  const router = useRouter()
  const [stage, setStage] = useState<"fetching" | "details" | "verifying" | "success">("fetching")
  const [zelleId, setZelleId] = useState<string>("")

  // Simulate fetching Zelle details
  useState(() => {
    // In a real implementation, you would fetch the Zelle ID from your backend
    setTimeout(() => {
      setZelleId("payments@yourcompany.com")
      setStage("details")
    }, 2000)
  })

  const handleConfirmPayment = async () => {
    setStage("verifying")

    // Simulate payment verification
    // In a real implementation, you would verify the payment with your backend
    setTimeout(() => {
      setStage("success")

      // Redirect to success page after showing success message
      setTimeout(() => {
        if (successUrl) {
          router.push(successUrl)
        } else {
          router.push(`/checkout/success?transactionId=${transactionId}`)
        }
      }, 2000)
    }, 3000)
  }

  const textColor = isLightMode ? "text-green-800" : "text-foreground"
  const mutedTextColor = isLightMode ? "text-green-600" : "text-muted-foreground"
  const bgColor = isLightMode ? "bg-green-50" : "bg-muted/50"
  const buttonBgColor = isLightMode ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"

  return (
    <Card className={`p-6 ${isLightMode ? "bg-white border-green-100" : "bg-card border-border"}`}>
      {/* <h2 className={`text-xl font-semibold mb-4 ${textColor}`}>Pay with Zelle</h2> */}

      {stage === "fetching" && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <Loader2 className={`h-8 w-8 animate-spin mb-4 ${textColor}`} />
          <p className={`${textColor} font-medium`}>Fetching Zelle details...</p>
        </div>
      )}

      {stage === "details" && (
        <div className={`flex flex-col p-6 ${bgColor} rounded-lg`}>
          <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Pay to this Zelle account</h3>

          <div className="space-y-4 mb-6">
            <div className="flex flex-col">
              <span className={`${mutedTextColor} text-sm`}>Zelle ID:</span>
              <span className={`${textColor} font-medium text-lg`}>{zelleId}</span>
            </div>

            <div className="flex flex-col">
              <span className={`${mutedTextColor} text-sm`}>Amount to pay:</span>
              <span className={`${textColor} font-bold text-xl`}>${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* <p className={`${mutedTextColor} text-sm mb-4`}>
            Please open your banking app and send the exact amount to the Zelle ID above. Once completed, click the
            button below.
          </p> */}

          <Button onClick={handleConfirmPayment} className={`w-full ${buttonBgColor}`}>
            Yes, I have paid
          </Button>
        </div>
      )}

      {stage === "verifying" && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <Loader2 className={`h-8 w-8 animate-spin mb-4 ${textColor}`} />
          <p className={`${textColor} font-medium`}>Verifying your payment...</p>
          <p className={`${mutedTextColor} text-sm mt-2`}>This may take a few moments</p>
        </div>
      )}

      {stage === "success" && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <CheckCircle className={`h-8 w-8 mb-4 ${isLightMode ? "text-green-600" : "text-primary"}`} />
          <p className={`${textColor} font-medium`}>Payment successful!</p>
          <p className={`${mutedTextColor} text-sm mt-2`}>Amount paid: ${amount.toFixed(2)}</p>
          <p className={`${mutedTextColor} text-sm mt-1`}>Redirecting to success page...</p>
        </div>
      )}
    </Card>
  )
}
