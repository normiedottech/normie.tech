import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'



import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { normieTechClient } from '@/lib/normie-tech'
import { getTransactionById } from '@/actions/product'




export default async function PaymentSuccessPage({
    searchParams
}: {
    searchParams: { 
        transactionId?: string;
        lightMode?: string;
    }
}) {
    const isLightMode = searchParams.lightMode === 'true';
    
    if (!searchParams.transactionId) { 
        notFound()
    }
    const res = await getTransactionById(searchParams.transactionId)
  
    if (res.error) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl">
                    <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
                        <div className="flex flex-col items-center p-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-slate-900">Payment Processing Error</h1>
                            <p className="mb-6 text-slate-600">{JSON.stringify(res.error)}</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }
    if (!res?.res) {
        return "Error"
    }
    const { amountInFiat, blockchainTransactionId, extraMetadataJson, status } = res.res.transaction
    
    if(status === "cancelled"){
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl">
                    <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
                        <div className="flex flex-col items-center p-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-slate-900">Transaction Cancelled</h1>
                            <p className="mb-6 text-slate-600">The transaction was cancelled. Please try again.</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }
    if(status === "failed"){
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-2xl">
                    <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg">
                        <div className="flex flex-col items-center p-6 text-center">
                            <h1 className="mb-2 text-2xl font-bold text-slate-900">Transaction Failed</h1>
                            <p className="mb-6 text-slate-600">The transaction failed. Please try again.</p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

            
    return (
        <div className={`min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8 ${
            isLightMode ? 'bg-slate-50' : 'bg-gray-900'
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
                                    Transaction Amount
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    ${amountInFiat?.toFixed(2)}
                                </div>
                            </div>
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
                                    Transaction Amount
                                </div>
                                <div className="text-2xl font-bold text-gray-100">
                                    ${amountInFiat?.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}