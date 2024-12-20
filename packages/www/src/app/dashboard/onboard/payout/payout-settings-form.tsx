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
import { addPayoutSettings } from '../../actions/create-project'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
type FormData = {
  settlementType: 'payout' | 'smartContract'
  payoutTime: 'instant' | 'custom'
  blockchain: 'arbitrum' | 'tron'
  address: string
}

export default function PayoutSettingsForm() {
  const [showPayoutOptions, setShowPayoutOptions] = useState(true)

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      settlementType: 'payout',
      payoutTime: 'instant',
      blockchain: 'arbitrum',
      address: '',
    },
  })
  const router = useRouter()
  const {mutateAsync,isPending} = useMutation({
    mutationFn:async (data:FormData)=>{
       const  res = await addPayoutSettings({
        payoutPeriod:data.payoutTime
       })
       if(res.success){
            toast.success(res.message)
            return res
       }
       else{
            toast.error(res.message)
            throw new Error(res.message)   
       }
       
    },
    onSuccess:()=>{
        // redirect to the next page
        router.push('/dashboard')
    }
  })
  const settlementType = watch('settlementType')
  const payoutTime = watch('payoutTime')
  const blockchain = watch('blockchain')

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Payout Settings</CardTitle>
          <CardDescription>Configure your payout preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        <p className="text-sm text-gray-500">Select payout if you want your funds to settle on your crypto wallet</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="smartContract" id="smartContract" className="mt-1" />
                      <div>
                        <Label htmlFor="smartContract" className="font-medium">Smart Contract</Label>
                        <p className="text-sm text-gray-500">Select smart contract if you want the funds to be sent to a smart contract and funds to settle</p>
                      </div>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {settlementType === 'smartContract' && (
              <div className="bg-yellow-100 p-4 rounded-md">
                <p className="text-sm text-yellow-800">This service is currently invite only. Book a call with us to understand your project in order to onboard you to smart contract settlements.</p>
                <Button type="button" className="mt-2 w-full sm:w-auto">Book a Call</Button>
              </div>
            )}

            {showPayoutOptions && (
              <>
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Payout Period</Label>
                  <Controller
                    name="payoutTime"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="instant" id="instant" />
                          <Label htmlFor="instant" className="font-medium">Instant</Label>
                          <p className="text-sm text-gray-500">Only Arbitrum supported for now.</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="custom" id="custom" className="mt-1" />
                          <div>
                            <Label htmlFor="custom" className="font-medium">Manual</Label>
                            <p className="text-sm text-gray-500">You can receive funds whenever you click the payout button. Arbitrum and Tron supported currently.</p>
                          </div>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Blockchain</Label>
                  <Controller
                    name="blockchain"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="arbitrum" id="arbitrum" />
                          <Label htmlFor="arbitrum" className="font-medium">Arbitrum</Label>
                        </div>
                        {payoutTime === 'instant' && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tron" id="tron" />
                            <Label htmlFor="tron" className="font-medium">Tron</Label>
                          </div>
                        )}
                      </RadioGroup>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-lg font-semibold">Wallet Address</Label>
                  <Controller
                    name="address"
                    control={control}
                    rules={{
                      required: "Wallet address is required",
                      validate: (value) => {
                        blockchain === 'arbitrum' && !isAddress(value) 
                        ? "Invalid Arbitrum address" 
                        : true

                        if(blockchain === 'arbitrum'){
                            return isAddress(value) ? true : "Invalid Arbitrum address"
                        }
                        if(blockchain === 'tron'){
                            return Tronweb.utils.address.isAddress(value) ? true : "Invalid Tron address"
                        }
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
                  <p className="text-sm text-blue-800">Polygon support is coming soon!</p>
                </div>
              </>
            )}

            <Button type="submit"  className="w-full">{isPending ? "Loading"  :"Save Settings"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

