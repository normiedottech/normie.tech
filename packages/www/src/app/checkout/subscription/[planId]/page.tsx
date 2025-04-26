import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getPlanById } from "@/actions/product"
import { CheckoutPaypalSubscription } from "@/components/checkout/checkout-paypal-subscription"

export default async function SubscriptionCheckoutPage({
  params,
}: {
  params: { planId: string }
}) {
  const res = await getPlanById(params.planId)

  if (res.error) {
    return (
      <div className="min-h-screen mt-12 p-4 md:p-6 lg:p-8 bg-green-50">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg border-green-100">
            <div className="flex flex-col items-center p-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-green-800">Plan Error</h1>
              <p className="mb-6 text-green-700">{res.error}</p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!res.plan) {
    return notFound()
  }

  const { plan, product } = res
  const totalAmount = plan.amount / 100 // Convert from cents to dollars
  const isLightMode = res.settings?.colorModeInCheckout === "light"

  // Apply green-white light mode class if specified in settings
  const containerClasses = isLightMode
    ? "min-h-screen bg-neutral-100 p-4 md:p-6 lg:p-8 light"
    : "min-h-screen bg-background p-4 md:p-6 lg:p-8"

  const cardClasses = isLightMode
    ? "overflow-hidden mt-24 rounded-lg border border-green-100 bg-white text-green-900 shadow-lg"
    : "overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg my-4"

  const mutedBgClasses = isLightMode
    ? "flex flex-col gap-2 p-4 bg-green-50 rounded-lg"
    : "flex flex-col gap-2 p-4 bg-muted/50 rounded-lg"

  const mutedTextClasses = isLightMode
    ? "text-sm text-green-600 font-medium"
    : "text-sm text-muted-foreground font-medium"

  return (
    <div className={`${containerClasses}`}>
      <div className="mx-auto max-w-2xl my-11">
        <Card className={cardClasses}>
          <div className="flex flex-col p-6">
            {product.imageUrl && (
              <div className="mb-6 relative w-full overflow-hidden rounded-lg">
                <div className="relative aspect-[4/3] w-full bg-muted/20">
                  <img
                    src={product.imageUrl}
                    alt={product.name || "Product image"}
                    className="absolute inset-0 h-full w-full object-contain p-2"
                  />
                  <div className={`absolute inset-0`} />
                </div>
              </div>
            )}
            <h1 className="mb-4 text-2xl font-bold">Subscribe to {product.name}</h1>
            <p className={`mb-6 ${isLightMode ? "text-black-700" : "text-muted-foreground"}`}>
              {product.description || ""}
            </p>

            <div className="space-y-4">
              <div className={mutedBgClasses}>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`${isLightMode ? "text-green-800" : ""}`}>
                      {product.name}
                    </span>
                    <div className="text-right">
                      <div className={`${isLightMode ? "text-green-800" : ""}`}>
                        ${totalAmount.toFixed(2)}
                      </div>
                      <div className={mutedTextClasses}>
                        per {plan.interval.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center font-medium">
                  <span className={`text-lg ${isLightMode ? "text-green-800" : ""}`}>Total</span>
                  <span className={`text-lg font-bold ${isLightMode ? "text-green-800" : ""}`}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <CheckoutPaypalSubscription
                projectId={res.projectId}
                planId={plan.id}
                amount={totalAmount}
                description={`Subscribe to ${product.name}`}
                isLightMode={isLightMode}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
