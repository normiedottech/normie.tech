'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/app/dashboard/actions/create-project'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from 'sonner'
import { signOut, useSession } from 'next-auth/react'
import { auth } from '@/server/auth'


export function ProjectForm() {
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const {data:session} = useSession()
  if(!session){
    router.push('/dashboard/sign-in')
  }
  if(!session?.user.id){
    router.push('/dashboard/onboard')
  }
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.log('submitting')
    setIsLoading(true)
    if(!session?.user.id){
        setIsLoading(false)
        return
    }
    const formData = new FormData(event.currentTarget)
    const response = await createProject(formData,session?.user.id)
    console.log(response)
    setIsLoading(false)

    if (response.success) {
      toast.success("Success",{
        description: <p>{response.message}</p>,
      })
      router.push('/dashboard')
    } else {
      toast.error("Error",{
       
        description: <p>Something went wrong. Please try again.</p>,
    
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>Enter the details for your new project.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Full Name</Label>
            <Input id="full-name" name="full-name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Business URL</Label>
            <Input id="url" name="url" type="url" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payoutAddressOnEvm">Payout Address on EVM</Label>
            <Input id="payoutAddressOnEvm" name="payoutAddressOnEvm"  required/>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col my-4 gap-4'>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
          <Button className="w-full" onClick={()=>signOut()}>
            Logout
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

