'use server'

import { signIn } from "@/server/auth"
import { cookies } from "next/headers"
export async function saveReferral(referral:string){
  const cookieStore = await cookies()
  cookieStore.set("referral",referral)
  
}
export async function signInWithEmail(email:string,referral?:string) {
  try {
    const cookieStore = await cookies()
    if(referral){
      cookieStore.set("referral",referral)
    }
 

    await signIn("resend", {
      email: email,
      redirect: true,
      redirectTo:"/dashboard/onboard"
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to sign in. Please try again." }
  }
}

