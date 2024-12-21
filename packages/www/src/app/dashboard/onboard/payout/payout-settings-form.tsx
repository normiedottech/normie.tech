'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { isAddress } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Tronweb from 'tronweb'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import BookNoahACall from '@/components/aryan-component/book-a-call'
import { createPayoutSettings } from '../../actions/payout'
import { DEFAULT_BLOCKCHAIN, VALID_BLOCKCHAINS } from '@/lib/constants'

// Bring in your array of valid blockchains:


type FormData = {
  settlementType: 'payout' | 'smart-contract' 
  payoutTime: 'instant' | 'custom'
  blockchain: string
  address: string
}

export default function PayoutSettingsForm() {
  const [showPayoutOptions, setShowPayoutOptions] = useState(true)

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      settlementType: 'payout',
      payoutTime: 'instant',
      blockchain: DEFAULT_BLOCKCHAIN, // or set to "arbitrum-one" or your desired default
      address: '',
    },
  })
  
  const router = useRouter()
  
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      // Find the blockchain object from VALID_BLOCKCHAINS
      const selectedBlockchain = VALID_BLOCKCHAINS.find(
        (b) => b.value === data.blockchain
      )

      const res = await createPayoutSettings({
        payoutPeriod: data.payoutTime,
        blockchain: (selectedBlockchain?.value as any) ?? 'arbitrum-one', // fallback if needed
        chainId: selectedBlockchain?.chainId ?? 0,
        payoutAddress: data.address,
        settlementType: data.settlementType,
      })

      if (res.success) {
        toast.success(res.message)
        return res
      } else {
        toast.error(res.message)
        throw new Error(res.message)
      }
    },
    onSuccess: () => {
      // redirect to the next page
      router.push('/dashboard')
    }
  })
  
  const settlementType = watch('settlementType')
  const payoutTime = watch('payoutTime')
  const blockchain = watch('blockchain')

  const onSubmit = async (data: FormData) => {
    await mutateAsync(data)
  }

  // Filter the list of valid blockchains based on whether they're instant or custom
  const blockchainsToShow = VALID_BLOCKCHAINS.filter((chain) =>
    payoutTime === 'instant' ? chain.isInstant : chain.isCustom
  )

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Payout Settings</CardTitle>
          <CardDescription>Configure your payout preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Settlement Type */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Settlement Type</Label>
              <Controller
                name="settlementType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value)
                      setShowPayoutOptions(value === 'payout')
                    }}
                    value={field.value}
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="payout" id="payout" className="mt-1" />
                      <div>
                        <Label htmlFor="payout" className="font-medium">Payout</Label>
                        <p className="text-sm text-gray-500">
                          Select payout if you want your funds to settle on your crypto wallet
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="smart-contract" id="smart-contract" className="mt-1" />
                      <div>
                        <Label htmlFor="smart-contract" className="font-medium">
                          Smart Contract
                        </Label>
                        <p className="text-sm text-gray-500">
                          Select smart contract if you want the funds to be sent to a 
                          smart contract and funds to settle
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Invitation notice if they choose Smart Contract */}
            {settlementType === 'smart-contract' && (
              <div className="bg-yellow-100 p-4 rounded-md">
                <p className="text-sm text-yellow-800">
                  This service is currently invite only. Book a call with us to 
                  understand your project in order to onboard you to smart contract settlements.
                </p>
                <BookNoahACall />
              </div>
            )}

            {/* If user chooses "payout", show the rest of the settings */}
            {showPayoutOptions && (
              <>
                {/* Payout Time */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Payout Period</Label>
                  <Controller
                    name="payoutTime"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="instant" id="instant" />
                          <Label htmlFor="instant" className="font-medium">Instant</Label>
                          <p className="text-sm text-gray-500">
                            Only Arbitrum supported for now.
                          </p>
                        </div>

                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="custom" id="custom" className="mt-1" />
                          <div>
                            <Label htmlFor="custom" className="font-medium">Manual</Label>
                            <p className="text-sm text-gray-500">
                              You can receive funds whenever you click the payout button. 
                              Arbitrum and Tron supported currently.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                {/* Blockchain RadioGroup */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Blockchain</Label>
                  <Controller
                    name="blockchain"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        {blockchainsToShow.map((chain) => (
                          <div key={chain.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={chain.value} 
                              id={chain.value} 
                            />
                            <Label htmlFor={chain.value} className="font-medium">
                              {chain.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-lg font-semibold">
                    Wallet Address
                  </Label>
                  <Controller
                    name="address"
                    control={control}
                    rules={{
                      required: "Wallet address is required",
                      validate: (value) => {
                        // Use the currently selected blockchain to decide how to validate
                        if (blockchain === 'arbitrum-one') {
                          return isAddress(value)
                            ? true
                            : "Invalid Arbitrum address"
                        }
                        if (blockchain === 'tron') {
                          return Tronweb.utils.address.isAddress(value)
                            ? true
                            : "Invalid Tron address"
                        }
                        // Default fallback (e.g. if more blockchains are added later)
                        return true
                      }
                    }}
                    render={({ field }) => (
                      <Input 
                        id="address" 
                        {...field}
                        placeholder="Enter your wallet address"
                        className="w-full"
                      />
                    )}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="bg-blue-100 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    Polygon support is coming soon!
                  </p>
                </div>
              </>
            )}

            {/* Only show submit if settlementType === payout */}
            {settlementType === "payout" && (
              <Button type="submit" className="w-full">
                {isPending ? "Loading" : "Save Settings"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
