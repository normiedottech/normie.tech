"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createRemitPaymentLink } from "@/actions/remit"
import { useTranslations } from "next-intl"
import { getUserLocale, setUserLocale } from "@/actions/locale"
import { useRouter } from "next/navigation"

import { ZellePhoenixRemittance } from "@normietech/core/remit/index"
export default function PaymentPage({
  searchParams,
}: {
  searchParams: {
    projectId?: string
  }
}) {
  const projectId = searchParams.projectId ?? ZellePhoenixRemittance.PROJECT_ID
  const [address, setAddress] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<string>("en")
  const router = useRouter()
  const errorText = useTranslations('Error')
  const copyToClipboardText = useTranslations('CopyToClipboard')
  const remittancePageText = useTranslations('RemittancePage')
  

 
  const toggleLanguage = async () => {
    const newLocale = currentLocale === "en" ? "es" : "en"
    await setUserLocale(newLocale)
    setCurrentLocale(newLocale)
    router.refresh()
  }

  const handleSave = async () => {
    if (!address.trim()) {
      toast({
        title: errorText('Toast.Title', {
          title: "Error"
        }),
        description: errorText('Toast.Description.InvalidUSDCAddress'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await createRemitPaymentLink(address,projectId)
      if (result && result[0]?.link) {
        setPaymentLink(result[0].link)
        toast({
          title: "Success",
          description: remittancePageText('CardFooter.Success'),
        })
      } else {
        throw new Error("Error al generar enlace de pago")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: errorText('Toast.Description.FailedGeneratingPaymentLink'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink)
    setIsCopied(true)
    toast({
      title: "Success",
      description: copyToClipboardText('Success'),
    })

    // Reset the copy icon after 2 seconds
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex justify-end mb-4">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-green-400"
        >
          {currentLocale === "en" ? "Español" : "English"}
        </Button>
      </div>
      <Card className="w-full max-w-md border-green-500 bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="text-green-400">{remittancePageText('CardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-300">
              {remittancePageText('InputLabel')}
            </Label>
            <Input
              id="address"
              placeholder={remittancePageText('InputPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {paymentLink && (
            <div className="space-y-2">
              <Label htmlFor="payment-link" className="text-gray-300">
                {remittancePageText('ButtonLabel')}
              </Label>
              <div className="flex">
                <Input
                  id="payment-link"
                  value={paymentLink}
                  readOnly
                  className="bg-gray-800 border-gray-700 text-white rounded-r-none"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="rounded-l-none border-l-0 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-green-400"
                >
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!paymentLink && (
            <Button 
              onClick={handleSave} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? remittancePageText('ButtonLabelLoading') : remittancePageText('ButtonLabel')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}