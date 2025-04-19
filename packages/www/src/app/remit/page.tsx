"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createRemitPaymentLink } from "@/actions/remit"

export default function PaymentPage() {
  const [address, setAddress] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese una dirección USDC válida",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await createRemitPaymentLink(address)
      if (result && result[0]?.link) {
        setPaymentLink(result[0].link)
        toast({
          title: "Éxito",
          description: "Enlace de pago generado con éxito",
        })
      } else {
        throw new Error("Error al generar enlace de pago")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar enlace de pago. Por favor intente nuevamente.",
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
      title: "Copiado",
      description: "Enlace de pago copiado al portapapeles",
    })

    // Reset the copy icon after 2 seconds
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-500 bg-gray-900 text-white">
        <CardHeader>
          {/* <CardTitle className="text-green-400">Generador de Pagos USDC</CardTitle> */}
          <CardTitle className="text-green-400">Generar un enlace de pago para USDC en Base para recibir pagos en zelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-gray-300">
              Dirección USDC en Base
            </Label>
            <Input
              id="address"
              placeholder="Ingresar dirección USDC"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
            <p className="text-gray-300 text-sm">
              Comisiones de la Plataforma: <span className="text-green-400 font-semibold">2%</span>
            </p>
          </div> */}

          {paymentLink && (
            <div className="space-y-2">
              <Label htmlFor="payment-link" className="text-gray-300">
                Enlace de Pago
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
              {isLoading ? "Generando..." : "Guardar"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}