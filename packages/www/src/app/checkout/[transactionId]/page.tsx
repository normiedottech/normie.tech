import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getTransactionById } from "@/actions/product"
import { CheckoutPayment } from "@/components/checkout/checkout-payment"

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { transactionId: string }
  searchParams: { orderId?: string }
}) {
  if (!searchParams.orderId) {
    notFound()
  }

  const res = await getTransactionById(params.transactionId)

  if (res.error) {
    return (
      <div className="min-h-screen mt-12 p-4 md:p-6 lg:p-8 bg-green-50">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg border-green-100">
            <div className="flex flex-col items-center p-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-green-800">Transaction Error</h1>
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

  if (!res.res) {
    return notFound()
  }

  const { products, status, metadataJson } = res.res.transaction
  const isLightMode = res.res.settings?.colorModeInCheckout === "light"

  if (status === "fiat-confirmed" || status === "confirmed-onchain") {
    return redirect(`/checkout/success?transactionId=${params.transactionId}`)
  }

  const totalAmount = res.res?.transaction?.amountInFiat ?? 0
  const flatFee = 0.49
  console.log("res.res.settings?.ignorePaymentProcessorFees", res.res.settings?.ignorePaymentProcessorFees)
  const percentageFee = totalAmount * ((res.res.settings?.ignorePaymentProcessorFees ? 0 : 0.0349) + (res.res?.project?.feePercentage ?? 0) / 100)
  const totalFees = flatFee + percentageFee
  console.log("totalFees", totalFees)
  console.log("totalAmount", totalAmount)
  console.log("percentageFee", percentageFee)
  const amountAfterFees = totalAmount - totalFees

  // Apply green-white light mode class if specified in settings
  const containerClasses = isLightMode
    ? "min-h-screen bg-green-50 p-4 md:p-6 lg:p-8 light"
    : "min-h-screen bg-background p-4 md:p-6 lg:p-8"

  const cardClasses = isLightMode
    ? "overflow-hidden  mt-24 rounded-lg border border-green-100 bg-white text-green-900 shadow-lg "
    : "overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg my-4"

  const mutedBgClasses = isLightMode
    ? "flex flex-col gap-2 p-4 bg-green-50 rounded-lg"
    : "flex flex-col gap-2 p-4 bg-muted/50 rounded-lg"

  const mutedTextClasses = isLightMode
    ? "text-sm text-green-600 font-medium"
    : "text-sm text-muted-foreground font-medium"

  const borderClasses = isLightMode ? "h-px bg-green-100 my-2" : "h-px bg-border my-2"

  return (
    <div className={`${containerClasses}`}>
      <div className="mx-auto max-w-2xl my-11">
        <Card className={cardClasses}>
          <div className="flex flex-col p-6">
            <h1 className="mb-4 text-2xl font-bold font-bricolage">Checkout</h1>
            <p className={`mb-6 ${isLightMode ? "text-green-700" : "text-muted-foreground"}`}>
              {products?.description || "Complete your purchase"}
            </p>

            <div className="space-y-4">
              <div className={mutedBgClasses}>
                {res.res.settings?.showFeesInCheckout ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`${isLightMode ? "text-green-800" : ""}`}>
                          {products?.name || "Product"}
                        </span>
                        <div className="text-right">
                          <div className={`${isLightMode ? "text-green-800" : ""}`}>
                            ${amountAfterFees.toFixed(2)}
                          </div>
                         
                        </div>
                      </div>
                    </div>
                    
                  
                    <div className="flex justify-between items-center">
                      <span className={`${isLightMode ? "text-green-800" : "text-muted-foreground"}`}>
                        Payment Processor Fees
                      </span>
                      <span className={`${isLightMode ? "text-green-800" : "text-muted-foreground"}`}>
                        ${totalFees.toFixed(2)}
                      </span>
                    </div>
                    
                

                    <div className={borderClasses} />
                  </>
                ) : null}

                <div className="flex justify-between items-center font-medium">
                  <span className={`text-lg ${isLightMode ? "text-green-800" : ""}`}>Total</span>
                  <span className={`text-lg font-bold ${isLightMode ? "text-green-800" : ""}`}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <CheckoutPayment
                projectId={res.res.transaction.projectId ?? ""}
                transactionId={params.transactionId}
                amount={totalAmount}
                description={products?.description ?? "Complete your purchase"}
                orderId={searchParams.orderId}
                successUrl={(metadataJson as any)?.successUrl}
                isLightMode={isLightMode}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

