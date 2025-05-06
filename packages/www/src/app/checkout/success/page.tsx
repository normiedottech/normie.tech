import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: { 
    amount?: string;
    lightMode?: string;
  }
}) {
  const amount = searchParams.amount ? parseFloat(searchParams.amount) : null
  const isLightMode = searchParams.lightMode === 'true'

  if (!amount) {
    notFound()
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8 ${
      isLightMode ? 'bg-slate-50' : 'bg-black-900'
    }`}>
      <div className="mx-auto max-w-2xl">
        {isLightMode ? (
          <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Payment Successful!
              </h1>

              <div className="mb-6 w-full rounded-lg bg-gray-100 p-4">
                <div className="text-sm text-gray-600">
                  Subscription Amount
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${amount.toFixed(2)}
                </div>
              </div>

              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-lg border-0 bg-gray-800 shadow-lg">
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-700">
                <svg
                  className="h-8 w-8 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-100">
                Payment Successful!
              </h1>

              <div className="mb-6 w-full rounded-lg bg-gray-700 p-4">
                <div className="text-sm text-gray-400">
                  Subscription Amount
                </div>
                <div className="text-2xl font-bold text-gray-100">
                  ${amount.toFixed(2)}
                </div>
              </div>

              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
