"use client"

import { API_URL } from "@/lib/constants"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { act, useState } from "react"
import { toast } from "sonner"
import { env } from "../../../env"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import CountrySelect from "@/components/ui/country-select"
import RegionSelect from "@/components/ui/region-select"
import { usePayPalCardFields } from "@paypal/react-paypal-js"

// Dynamically import PayPal components
const PayPalScriptProvider = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalScriptProvider),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalButtons = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalButtons),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalCardFieldsProvider = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalCardFieldsProvider),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalNameField = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalNameField),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalNumberField = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalNumberField),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalExpiryField = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalExpiryField),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

const PayPalCVVField = dynamic(
  () => import("@paypal/react-paypal-js").then((mod) => mod.PayPalCVVField),
  { ssr: false ,loading: () => <div>Loading...</div>}
)

// Define the form schema
const formSchema = z.object({
  addressLine1: z.string().min(1, "Street address is required"),
  addressLine2: z.string().optional(),
  adminArea1: z.string().min(1, "State/Province is required"),
  adminArea2: z.string().min(1, "City is required"),
  countryCode: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "ZIP code is required"),
})

type FormValues = z.infer<typeof formSchema>

interface CheckoutPaymentProps {
  transactionId: string
  amount: number
  description?: string
  orderId: string
  successUrl?: string
  projectId: string
  isLightMode?: boolean
  enable3DS?: boolean
}

export function CheckoutPaypalPayment({
  projectId,
  transactionId,
  amount,
  description,
  orderId,
  successUrl,
  isLightMode = false,
  enable3DS = false,
}: CheckoutPaymentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      adminArea1: "",
      adminArea2: "",
      countryCode: "US",
      postalCode: "",
    },
  })

  const getComponents = () => {
    if(projectId === "voice-deck") {
      return "card-fields,buttons"
    }
    if(enable3DS) {
      return "buttons,card-fields"
    } else {
      return undefined
    }
  }

  const handleCardFieldsSubmit = async () => {
    try {
      let confirmingTransactionToast = toast.loading("Confirming transaction please wait...")
      setIsLoading(true)
      const res = await fetch(`${API_URL}/v1/payment/3/capture`, {
        method: "POST",
        body: JSON.stringify({
          orderID: orderId,
          transactionId: transactionId,
        }),
      })
      toast.dismiss(confirmingTransactionToast)
      
      if (successUrl) {
        window.location.href = successUrl
      } else {
        setIsLoading(false)      
        router.push(`/checkout/success?transactionId=${transactionId}&lightMode=${isLightMode}`)
      }
    } catch (error) {
      toast.dismiss()
      toast.error("Payment failed. Please try again.", {
        duration: 4000,
      })
      setIsLoading(false)
    }
  }

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
          components: getComponents(),
        }}
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            height: 48,
            label: "checkout",
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
          createOrder={async () => {
            try {
              return orderId
            } catch (error) {
              toast.error("Failed to create order. Please try again.")
              throw error
            }
          }}
          onApprove={handleCardFieldsSubmit}
        />

        {enable3DS && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            <PayPalCardFieldsProvider
              createOrder={async () => orderId}
              onApprove={(data) => {
                const { liabilityShift }: { liabilityShift: string } = data as any
                if(liabilityShift && (liabilityShift === "POSSIBLE" || liabilityShift === "YES")) {
                  handleCardFieldsSubmit()
                } else {
                  toast.error("Payment failed. Please try again.")
                  setIsPaying(false)
                }
              }}
              onError={(err) => {
                console.error("PayPal Card Fields Error:", err)
                toast.error("Failed to process payment. Please try again.")
                setIsPaying(false)
              }}
              style={{
                input: {
                  "font-size": "16px",
                  "font-family": "system-ui, -apple-system, sans-serif",
                  color: isLightMode ? "#000" : "#fff",
                },
                ".invalid": { color: "red" },
              }}
            >
              <div className="space-y-4">
                <PayPalNameField
                  style={{
                    input: { color: isLightMode ? "#000" : "#fff" },
                    ".invalid": { color: "red" },
                  }}
                />
                <PayPalNumberField />
                <PayPalExpiryField />
                <PayPalCVVField />
                
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Street Address *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="street-address"
                                placeholder="Street address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Apt, Suite, Building (optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="address-line2"
                                placeholder="Apartment, suite, building (optional)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminArea2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="address-level2"
                                placeholder="City"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <CountrySelect
                                placeholder="Select country"
                                onChange={(country) => {
                                  field.onChange(country)
                                  form.setValue("adminArea1", "") // Reset state when country changes
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminArea1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province *</FormLabel>
                            <FormControl>
                              <RegionSelect
                                countryCode={form.getValues("countryCode")}
                                onChange={field.onChange}
                                className="w-full"
                                placeholder="Select state/province"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="postal-code"
                                placeholder="ZIP code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <SubmitPayment
                      isPaying={isPaying}
                      setIsPaying={setIsPaying}
                      billingAddress={form.getValues()}
                      isValid={form.formState.isValid}
                    />
                  </form>
                </Form>
              </div>
            </PayPalCardFieldsProvider>
          </>
        )}
      </PayPalScriptProvider>
    </div>
  )
}

const SubmitPayment = ({ 
  isPaying, 
  setIsPaying, 
  billingAddress,
  isValid
}: { 
  isPaying: boolean
  setIsPaying: (value: boolean) => void
  billingAddress: any
  isValid: boolean
}) => {
  const { cardFieldsForm } = usePayPalCardFields()

  const handleClick = async () => {
    if (!cardFieldsForm) {
      const childErrorMessage = "Unable to find any child components in the <PayPalCardFieldsProvider />"
      throw new Error(childErrorMessage)
    }

    const formState = await cardFieldsForm.getState()

    if (!formState.isFormValid) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setIsPaying(true)

    try {
      await cardFieldsForm.submit()
    } catch (err) {
      setIsPaying(false)
      toast.error("Payment failed. Please try again.")
    }
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={(e) => {
        e.preventDefault()
        handleClick()
      }}
      disabled={!isValid || isPaying}
    >
      {isPaying ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Processing...
        </div>
      ) : (
        "Pay Now"
      )}
    </Button>
  )
}

