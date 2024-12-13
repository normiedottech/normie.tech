'use server'

import { auth } from "@/server/auth"
import { db } from "@normietech/core/database/index"
import { apiKeys, paymentLinks, projects } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
export type Project = typeof projects.$inferSelect
export async function getProjectById(projectId: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.projectId, projectId)
  })
}

export async function getUserApiKey() {
    const session = await auth()
    if(!session) throw new Error('Unauthorized')
    if(!session.user.projectId) throw new Error('Unauthorized')
    const api = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.projectId, session.user.projectId)
    })
    if(!api) throw new Error('API Key not found')
    return api.apiKey

}



export const fetchPaymentLinks = async (projectId: string) => {
  if (!projectId) throw new Error("Project ID is required")

  try {
    const links = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.projectId, projectId))

    return links
  } catch (error) {
    console.error("Error fetching payment links:", error)
    throw new Error("Failed to fetch payment links")
  }
}
