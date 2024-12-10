import {AuthForm} from '@/components/auth/auth-form'
import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
    const session = await auth()
    
    if(session && !session?.user.projectId){
      redirect('/dashboard/onboard')
    }
    if(session && session?.user.projectId){
      redirect('/dashboard')
    }
  return (
    <div className="container mx-auto py-10 mt-12 min-h-screen">
      <AuthForm />
    </div>
  )
}