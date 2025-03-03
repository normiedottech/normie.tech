'use server'

import { DOMAIN, STAGE } from "@/lib/constants"
import { auth } from "@/server/auth"
import { generateAPIKey } from "@/server/utils"
import { db } from "@normietech/core/database/index"
import { apiKeys, errorMessage, paymentLinks, products, projects, users } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
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
export async function switchApiKey() {
  const session = await auth()
  if(!session) throw new Error('Unauthorized')
  if(!session.user.projectId) throw new Error('Unauthorized')
  const newApi = generateAPIKey()
  const api = await db.update(apiKeys).set({
    apiKey:newApi
  }).where(eq(apiKeys.projectId, session.user.projectId))
  return {success:true, apiKey:newApi}
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
export const createPaymentLink  = async (name:string) => {
  const session = await auth()
  if(!session) throw new Error('Unauthorized')
  if(!session.user.projectId) throw new Error('Unauthorized')
  const product = await db.insert(products).values({
    name,
    projectId:session.user.projectId,
  }).returning({
    id:products.id
  })
  if(!product) throw new Error('Failed to create product')
  if(!product[0].id) throw new Error('Failed to create product')
  const link = await db.insert(paymentLinks).values({
    projectId:session.user.projectId,
    link:`${DOMAIN}/product/${product[0].id}/pay`
  }).returning({
    link:paymentLinks.link
  })
  return link
}
export const fetchPaymentLinkById = async (paymentId: string) => {
  if (!paymentId) throw new Error("Payment ID is required")

  try {
    const link = await db
      .query.paymentLinks.findFirst({
        where: eq(paymentLinks.id, paymentId),
        columns: {
          link: true
        }
      })

    if (!link) throw new Error("Payment link not found")
    return link.link
  } catch (error) {
    console.error("Error fetching payment link:", error)
    throw new Error("Failed to fetch payment link")
  }
}