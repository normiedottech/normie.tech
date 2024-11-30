'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Copy, Loader2 } from 'lucide-react'
import { normieTechClient } from '@/lib/normie-tech'
import {nanoid} from "nanoid"
export default function CheckoutForm() {
  const [apiKey, setApiKey] = useState('')
  const [projectId, setProjectId] = useState('')
  const [payoutAddress, setPayoutAddress] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsSuccess(false)
    setCheckoutUrl('')
    
    try {
      const customId = nanoid(20)
      const response = await normieTechClient.POST('/v1/{projectId}/0/checkout',{
        body:{
            name,
            description,
            amount: parseFloat(amount) * 100,
            success_url: `${window.location.origin}/checkout/success?transactionId=${customId}&x=${apiKey}&projectId=${projectId}`,
            chainId: 10,
            metadata: {
              payoutAddress
            },
            customId,
            blockChainName:'optimism',

        },
        params:{
            header:{
                "x-api-key":apiKey
            },
            path:{
              projectId:projectId
            }
        }
      })
     

      if (response.response.ok) {
        const data = await response.data
        console.log('Checkout session created:', data)
        setCheckoutUrl(data?.url ?? '')
        setIsSuccess(true)
      } else {
        console.error('Failed to create checkout session')
        // Handle error
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Checkout Session</CardTitle>
        <CardDescription>Enter details to create a new checkout session</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">Project Id</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutAddress">Payout Address</Label>
            <Input
              id="payoutAddress"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#00B67A] text-white hover:bg-[#009966]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Checkout Session'
            )}
          </Button>
        </form>
      </CardContent>
      {isSuccess && (
        <CardFooter>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Checkout session created successfully.</AlertDescription>
          </Alert>
        </CardFooter>
      )}
      {checkoutUrl && (
        <CardFooter>
          <Alert>
            <AlertTitle>Checkout URL Created</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="flex items-center space-x-2">
                <Input value={checkoutUrl} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}

