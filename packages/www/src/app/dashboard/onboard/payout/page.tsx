import { auth } from '@/server/auth'
import PayoutSettingsForm from './payout-settings-form'
import { redirect } from 'next/navigation'

export default async function PayoutSettingsPage() {
    const session = await auth()
    if(!session){
      redirect('/dashboard/sign-in')
    }
    if(session.user.onBoardStage === "payout-created"){
      redirect('/dashboard')
    }
  return (
    <div className="container mx-auto py-10">
      <PayoutSettingsForm />
    </div>
  )
}

