"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { updateZelleToGetDetail, fetchZelleMetadata, updateZelleToConfirmPayment } from "@/actions/zelle"

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
  const [zelleId, setZelleId] = useState<string>("")
  

  const { data, isFetching } = useQuery({
    queryKey: ["zelle-metadata", transactionId],
    queryFn: () => fetchZelleMetadata(transactionId),
    refetchInterval: 2000,
   
  })
  const zelleMetadata = data?.data




  useEffect(() => {
    if (zelleMetadata?.confirmationStatus === "payment-confirmed-by-admin") {
     
      setTimeout(() => {
        if (successUrl) {
          router.push(successUrl)
        } else {
          router.push(`/checkout/success?transactionId=${transactionId}`)
        }
      }, 2000)
    }
  }, [zelleMetadata])

  const { mutate: updateZelleStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: () => updateZelleToGetDetail(transactionId),
    onError: (error) => {
      console.error("Failed to update Zelle status:", error)
    }
  })

  const { mutate: confirmPayment, isPending: isConfirmingPayment } = useMutation({
    mutationFn: () => updateZelleToConfirmPayment(transactionId),
    onSuccess: () => {
      
    },
    onError: (error) => {
      console.error("Failed to confirm payment:", error)
      // You might want to show an error message to the user here
    }
  })

  const handleStartPayment = () => {
   
    updateZelleStatus()
  }

  const handleConfirmPayment = async () => {

    confirmPayment()
  }

  const textColor = isLightMode ? "text-green-800" : "text-foreground"
  const mutedTextColor = isLightMode ? "text-green-600" : "text-muted-foreground"
  const bgColor = isLightMode ? "bg-green-50" : "bg-muted/50"
  const buttonBgColor = isLightMode ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
  if(!zelleMetadata) {
    return <div>Loading...</div>
  }
  return (
    <Card className={`p-6 ${isLightMode ? "bg-white border-green-100" : "bg-card border-border"}`}>
      {zelleMetadata?.confirmationStatus === "not-started-by-sender" && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Pay with Zelle</h3>
          <p className={`${mutedTextColor} text-sm mb-6 text-center`}>
            Click the button below to start your Zelle payment process
          </p>
          <Button 
            onClick={handleStartPayment} 
            className={`w-full sm:w-auto ${buttonBgColor}`}
            size="lg"
          >
            Pay with Zelle
          </Button>
        </div>
      )}

      {zelleMetadata?.confirmationStatus === "wait-for-payment-details" && !zelleMetadata?.payoutDetails && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <Loader2 className={`h-8 w-8 animate-spin mb-4 ${textColor}`} />
          <p className={`${textColor} font-medium`}>Fetching Zelle details...</p>
        </div>
      )}

      {zelleMetadata?.confirmationStatus === "wait-for-payment-details" && zelleMetadata?.payoutDetails && (
        <div className={`flex flex-col p-6 ${bgColor} rounded-lg`}>
          <h3 className={`text-lg font-medium mb-4 ${textColor}`}>Pay to this Zelle account</h3>

          <div className="space-y-4 mb-6">
            <div className="flex flex-col">
              <span className={`${mutedTextColor} text-sm`}>Zelle ID:</span>
              <span className={`${textColor} font-medium text-lg`}>{zelleMetadata?.payoutDetails}</span>
            </div>

            <div className="flex flex-col">
              <span className={`${mutedTextColor} text-sm`}>Amount to pay:</span>
              <span className={`${textColor} font-bold text-xl`}>${zelleMetadata?.amount}</span>
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

      {zelleMetadata?.confirmationStatus === "payment-confirmed-by-sender" && (
        <div className={`flex flex-col items-center justify-center py-8 ${bgColor} rounded-lg`}>
          <Loader2 className={`h-8 w-8 animate-spin mb-4 ${textColor}`} />
          <p className={`${textColor} font-medium`}>Verifying your payment...</p>
          <p className={`${mutedTextColor} text-sm mt-2`}>This may take a few moments</p>
        </div>
      )}

      {zelleMetadata?.confirmationStatus === "payment-confirmed-by-admin" && (
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
