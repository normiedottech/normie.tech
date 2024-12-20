import { auth } from "@/server/auth";
import Dashboard from "./dashboard";
import { redirect } from "next/navigation";
import { getProjectById, getUserApiKey } from "./actions/dashboard";



export default async function DashboardPage() {
  const session = await auth()
  console.log({session})
  if(!session){
    redirect('/dashboard/sign-in')
  }
  if(!session?.user.projectId){
    redirect('/dashboard/onboard')
  }
  if(session.user.onBoardStage === "project-created"){
    redirect('/dashboard/onboard/payout')
  }

  const apiKey = await getUserApiKey()
  const project = await getProjectById(session.user.projectId)
  if(!project){
    return <div>Project not found</div>
  }
  return <div className="my-6">

  <Dashboard apiKey={apiKey} project={project}/>
  </div>
}
