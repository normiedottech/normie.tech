import {AuthForm} from '@/components/auth/auth-form'
import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
    const session = await auth()
    if(!session?.user.projectId){
      redirect('/dashboard/onboard')
    }
  return (
    <div className="container mx-auto py-10">
      <AuthForm />
    </div>
  )
}