import { ProjectForm } from '@/components/auth/project-form'
import { auth,handlers } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
    const session = await auth()
    if(!session){
     
      redirect('/dashboard/sign-in')
    }
    console.log(session)
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <ProjectForm />
    </div>
  )
}

