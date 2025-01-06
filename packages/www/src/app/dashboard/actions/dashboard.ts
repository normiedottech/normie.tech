'use server'

import { STAGE } from "@/lib/constants"
import { auth } from "@/server/auth"
import { db } from "@normietech/core/database/index"
import { apiKeys, errorMessage, paymentLinks, projects, users, failedStripeTransactions } from "@normietech/core/database/schema/index"
import { and, eq, sql } from "drizzle-orm";
export type Project = typeof projects.$inferSelect
export async function getProjectById(projectId: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.projectId as any, projectId)
  })
}
export async function getUserProjectId() {
  const session = await auth()
  if(!session) throw new Error('Unauthorized')
  if(!session.user.projectId) throw new Error('No project found')
  return session.user.projectId
}
export async function onBoardToKyc(){
  const session = await auth()
  if(!session) throw new Error('Unauthorized')
  if(!session.user.projectId) throw new Error('Unauthorized')
  if(STAGE !== 'production'){
    await db.update(users).set({
      onBoardStage:'kyc-completed'
    }).where(eq(users.id, session.user.id!))
    return {success:true}
  }
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

export const getErrorMessage = async (projectId: string) => {
  const messageObj = await db.query.errorMessage.findFirst({
    where: eq(errorMessage.projectId, projectId),
    columns:{ 
      message:true
    }
  })
  if(!messageObj) return null
  return messageObj.message
}

export const getFraudTransactionsCount = async(): Promise<number | null> => {
  const projectId = await getUserProjectId()
  const highRiskCount = await db
    .select({
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(failedStripeTransactions)
    .where(
      and(
        eq(failedStripeTransactions.productId, projectId),
        eq(failedStripeTransactions.failureMessage, "fraudulent")
      )
    );

    if(highRiskCount[0].count < 2) return null;
    return highRiskCount[0].count;
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
