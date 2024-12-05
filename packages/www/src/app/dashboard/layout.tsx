import { auth } from "@/server/auth"
import { SessionProvider } from "next-auth/react"
import { redirect } from "next/navigation"


export default async function RootLayout({  children }: { children: React.ReactNode }) {
 
  return (
 
    
        <SessionProvider>{children}</SessionProvider>
    
    
  )
}

