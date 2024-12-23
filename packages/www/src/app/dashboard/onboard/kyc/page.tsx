'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { API_URL, DOMAIN, STAGE } from '@/lib/constants'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { getProjectById, getUserProjectId, getUserprojectId, onBoardToKyc } from '../../actions/dashboard'
import { projects } from '@normietech/core/database/schema/index'

export default function KYCPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {data:session} = useSession()

  const startKYC = async () => {
    setIsLoading(true)
    if(!session) {
        toast.error('You need to be signed in to start KYC')
        return
    }
    try {
      if(STAGE !== "production"){
       const res =  await onBoardToKyc()
         if(res && res.success){
          router.push('/dashboard')
         }
         else{
          throw new Error('Failed to start KYC process')
         }
        
      }
      else {
        const project = await getUserProjectId()
        const response = await fetch(`${API_URL}/v1/identity/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // You can add any necessary payload here
            body: JSON.stringify({
                userId:session.user.id,
                projectId:project,
                successUrl:`${DOMAIN}/dashboard`
            
            }),
          })
    
          if (!response.ok) {
            throw new Error('Failed to start KYC process')
          }
    
          const data = await response.json()
          
          // Assuming the API returns a URL to redirect to
          if (data.url) {
            router.push(data.url)
          } else {
            // If no redirect URL, go to a default page
            router.push('/dashboard/onboard/kyc/in-progress')
          }
      }

      
    } catch (error) {
      console.error('Error starting KYC:', error)
      alert('Failed to start KYC process. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8">Know Your Customer (KYC)</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        To comply with regulations and ensure the security of our platform, we need to verify your identity.
      </p>
      <Button 
        onClick={startKYC} 
        disabled={isLoading}
        className="px-6 py-3 text-lg"
      >
        {isLoading ? 'Starting KYC...' : 'Click Here to Start KYC'}
      </Button>
    </div>
  )
}

