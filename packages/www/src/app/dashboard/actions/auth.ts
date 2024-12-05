'use server'

import { signIn } from "@/server/auth"

export async function signInWithEmail(formData:FormData) {
  try {
    const form = new FormData()
    // form.set("email", email)
    await signIn("resend", formData)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to sign in. Please try again." }
  }
}

