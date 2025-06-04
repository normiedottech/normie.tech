import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { db } from '@normietech/core/database/index'
import { transactions } from '@normietech/core/database/schema/index'
import { eq } from 'drizzle-orm'

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: { 
    transactionId?: string;
    lightMode?: string;
  }
}) {
  if(!searchParams.transactionId){
    return <div>Transaction ID is required</div>
  }
  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, searchParams.transactionId),
  })
  if(!transaction){
    return notFound()
  }
  const amount = transaction.amountInFiat
  const isLightMode = searchParams.lightMode === 'true'
  if(!amount){
    return <div>Amount is required</div>
  }

  const getStatusConfig = (status: string | null) => {
    if (!status) {
      return {
        title: 'Payment Processing',
        icon: (
          <svg className="h-8 w-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        bgColor: isLightMode ? 'bg-blue-100' : 'bg-blue-700',
        iconColor: isLightMode ? 'text-blue-600' : 'text-blue-300',
        buttonColor: 'bg-blue-600 hover:bg-blue-700'
      }
    }
    switch (status) {
      case 'failed':
        return {
          title: 'Payment Failed',
          icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          bgColor: isLightMode ? 'bg-red-100' : 'bg-red-700',
          iconColor: isLightMode ? 'text-red-600' : 'text-red-300',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bgColor: isLightMode ? 'bg-yellow-100' : 'bg-yellow-700',
          iconColor: isLightMode ? 'text-yellow-600' : 'text-yellow-300',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'fiat-confirmed':
      case 'confirmed-onchain':
      case 'confirmed':
        return {
          title: 'Payment Successful!',
          icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: isLightMode ? 'bg-green-100' : 'bg-green-700',
          iconColor: isLightMode ? 'text-green-600' : 'text-green-300',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      default:
        return {
          title: 'Payment Processing',
          icon: (
            <svg className="h-8 w-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          bgColor: isLightMode ? 'bg-blue-100' : 'bg-blue-700',
          iconColor: isLightMode ? 'text-blue-600' : 'text-blue-300',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const statusConfig = getStatusConfig(transaction.status)

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8 ${
      isLightMode ? 'bg-slate-50' : 'bg-black-900'
    }`}>
      <div className="mx-auto max-w-2xl">
        {isLightMode ? (
          <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
            <div className="flex flex-col items-center p-6 text-center">
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${statusConfig.bgColor}`}>
                <div className={statusConfig.iconColor}>
                  {statusConfig.icon}
                </div>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                {statusConfig.title}
              </h1>

              <div className="mb-6 w-full rounded-lg bg-gray-100 p-4">
                <div className="text-sm text-gray-600">
                  Amount
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${amount.toFixed(2)}
                </div>
              </div>

              <Button asChild className={statusConfig.buttonColor}>
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
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${statusConfig.bgColor}`}>
                <div className={statusConfig.iconColor}>
                  {statusConfig.icon}
                </div>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-100">
                {statusConfig.title}
              </h1>

              <div className="mb-6 w-full rounded-lg bg-gray-700 p-4">
                <div className="text-sm text-gray-400">
                  Amount
                </div>
                <div className="text-2xl font-bold text-gray-100">
                  ${amount.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
