import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { normieTechClient } from '@/lib/normie-tech'
import { getTransactionById } from '@/actions/product'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CheckoutPayment } from '@/components/checkout/checkout-payment'
import { API_URL } from '@/lib/constants'


export default async function CheckoutPage({
  params,
  searchParams
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
      <div className="min-h-screen  p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
            <div className="flex flex-col items-center p-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-slate-900">Transaction Error</h1>
              <p className="mb-6 text-slate-600">{res.error}</p>
              <Button asChild>
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

 

  const { products,status,metadataJson } = res.res.transaction;
  
 
  if(status === "fiat-confirmed" || status === "confirmed-onchain") {
    return (
        redirect(`/checkout/success?transactionId=${params.transactionId}`)
    )
    }
  
    const totalAmount = res.res?.transaction?.amountInFiat ?? 0
    const paypalFee = res.res.settings?.showFeesInCheckout ? (totalAmount * (0.0449 + (1/100))) + 0.49 : (totalAmount * 0.0449) + 0.49

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg my-4">
          <div className="flex flex-col p-6">
            <h1 className="mb-4 text-2xl font-bold font-bricolage">
              {products?.name || 'Checkout'}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {products?.description || 'Complete your purchase'}
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  ${res.res?.transaction.amountInFiat?.toFixed(2)}
                </span>
              </div>

              {
                res.res.settings?.showFeesInCheckout && (
               <p className=" text-muted-foreground ">
                 Estimated fee: ${paypalFee.toFixed(2)}
              </p>
              )
              }
  
              <CheckoutPayment
                projectId={res.res.transaction.projectId ?? ""}
                transactionId={params.transactionId}
                amount={res?.res?.transaction.products?.priceInFiat ?? 0}
                description={products?.description ?? "Complete your purchase"}
                orderId={searchParams.orderId}
                successUrl={(metadataJson as any)?.successUrl}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
