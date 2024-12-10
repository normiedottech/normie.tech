import { auth } from "@/server/auth";
import Dashboard from "./dashboard";
import { redirect } from "next/navigation";
import { getUserApiKey } from "./actions/dashboard";
import AryanHeader from "@/components/aryan-component/aryan-header";


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
  return <>
  <AryanHeader session={session} projectId={session?.user?.projectId || ""} />;
  <Dashboard apiKey={apiKey} projectId={session.user.projectId}/>
  </>
}
