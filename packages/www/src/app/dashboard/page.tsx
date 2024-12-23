import { auth } from "@/server/auth";
import Dashboard from "./dashboard";
import { redirect } from "next/navigation";
import { getProjectById, getUserApiKey } from "./actions/dashboard";
import AlertTab from "./alert-tab";

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    redirect('/dashboard/sign-in')
  }
  console.log(session)

  // Handle different onboarding stages
  switch (session.user.onBoardStage) {
    case "no-project-created":
      redirect('/dashboard/onboard')
    case "project-created":
      redirect('/dashboard/onboard/payout')
    case "payout-created":
      redirect('/dashboard/onboard/kyc')
    case "kyc-completed":
      // Continue to show dashboard
      break;
    default:
      // If onBoardStage is undefined or not recognized, redirect to the start of onboarding
      redirect('/dashboard/onboard')
  }
  if(!session.user.projectId) {
    redirect('/dashboard/onboard')
  }


  // Fetch API key and project data
  const apiKey = await getUserApiKey()
  const project = await getProjectById(session.user.projectId)

  if (!project) {
    return <div>Project not found</div>
  }
  if(!project.fiatActive){
    return <AlertTab  projectId={project.projectId}/>
  }

  return (
    <div className="my-6">
      <Dashboard apiKey={apiKey} project={project}/>
    </div>
  )
}

