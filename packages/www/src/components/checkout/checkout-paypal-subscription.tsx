"use client"

import { API_URL } from "@/lib/constants"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { env } from "../../../env"
import { Loader2 } from "lucide-react"

// Dynamically import PayPal components
const PayPalScriptProvider = dynamic(() => import("@paypal/react-paypal-js").then((mod) => mod.PayPalScriptProvider), {
  ssr: false,
})

const PayPalButtons = dynamic(() => import("@paypal/react-paypal-js").then((mod) => mod.PayPalButtons), { ssr: false })

interface CheckoutPaypalSubscriptionProps {
  projectId: string
  planId: string
  amount: number
  paypalPlanId: string
  description?: string
  isLightMode?: boolean
}

export function CheckoutPaypalSubscription({
  projectId,
  planId,
  paypalPlanId,
  amount,
  description,
  isLightMode = false,
}: CheckoutPaypalSubscriptionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Apply light mode styling when isLightMode is true
  const containerClasses = isLightMode
    ? "bg-white text-gray-900 rounded-lg p-4 mt-4 border border-gray-200 relative min-h-[150px]"
    : "bg-background text-foreground rounded-lg p-4 mt-4 border relative min-h-[150px]"

  const loaderOverlayClasses = isLightMode
    ? "absolute inset-0 flex items-center justify-center bg-white/80"
    : "absolute inset-0 flex items-center justify-center bg-background/80"

  return (
    <div className={containerClasses}>
      {isLoading && (
        <div className={loaderOverlayClasses}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      <PayPalScriptProvider
        options={{
          disableFunding: "paylater",
          clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          components: projectId === "voice-deck" ? "card-fields,buttons" : undefined,
          intent:"subscription",
          vault:true,
          
        }}
        
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            height: 48,
            label: "subscribe",
            shape: "rect",
            tagline: false,
          }}
          onInit={() => {
            setIsLoading(false)
          }}
          onError={(err) => {
            console.error("PayPal Error:", err)
            toast.error("Failed to load payment system. Please try again later.")
            setIsLoading(false)
          }}
          createSubscription={async (data, actions) => {
            

            // const res = await actions.subscription.create({
            //   plan_id: paypalPlanId,
            // })
            // console.log({res})
            // return res
            try {
              const response = await fetch(`${API_URL}/v1/${projectId}/0/subscription`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  planId
              
                }),
              })

              if (!response.ok) {
                throw new Error("Failed to create subscription")
              }

              const data = await response.json()
             
              console.log(data.subscription.externalSubscriptionId,"alksjflasdjf;")
              return data.subscription.externalSubscriptionId
            } catch (error) { 
              toast.error("Failed to create subscription. Please try again.")
              throw error
            }
          }}
          onApprove={async (data) => {
            try {
              console.log({data})
              let confirmingSubscriptionToast = toast.loading("Confirming subscription please wait...")
              setIsLoading(true)

              if (data.subscriptionID) {
                toast.dismiss(confirmingSubscriptionToast)
                toast.success("Subscription created successfully!")
                router.push("/checkout/subscription/success")
              } else {
                throw new Error("No subscription ID received")
              }
            } catch (error) {
              toast.dismiss()
              toast.error("Subscription failed. Please try again.", {
                duration: 4000,
              })
              setIsLoading(false)
            }
          }}
        />
      </PayPalScriptProvider>
    </div>
  )
} 