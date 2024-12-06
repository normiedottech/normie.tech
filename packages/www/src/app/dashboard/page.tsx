import { auth } from "@/server/auth";
import Dashboard from "./dashboard";
import { redirect } from "next/navigation";
import { getUserApiKey } from "./actions/dashboard";


export default async function DashboardPage() {
  const session = await auth()
  console.log(session)
  if(!session){
    redirect('/dashboard/sign-in')
  }
  if(!session?.user.projectId){
    redirect('/dashboard/onboard')
  }
  const apiKey = await getUserApiKey()
  return <><Dashboard apiKey={apiKey} projectId={session.user.projectId}/></>
}
