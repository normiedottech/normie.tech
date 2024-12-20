import { ProjectForm } from '@/components/auth/project-form'
import { auth,handlers } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function Page({
  searchParams
}: {
  searchParams: { referral?: string }
}) {
    const session = await auth()
    if(!session){
      redirect('/dashboard/sign-in')
    }
    if(session.user.onBoardStage !== "no-project-created"){
      redirect('/dashboard')
    }
  
  return (
    <div className="mt-12 container mx-auto p-4 py-10">
      <ProjectForm />
    </div>
  )
}

