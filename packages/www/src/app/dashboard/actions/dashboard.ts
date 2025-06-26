'use server'

import { DOMAIN, STAGE } from "@/lib/constants"
import { auth } from "@/server/auth"
import { generateAPIKey } from "@/server/utils"
import { db } from "@normietech/core/database/index"
import { apiKeys, errorMessage, paymentLinks, products, projects, users } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { Resource } from "sst";

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

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // SST automatically configures credentials from your AWS profile
});

// Updated createPaymentLink to handle FormData instead of File
export const createPaymentLink = async (name: string, price?: string, imageFormData?: FormData) => {
  const session = await auth()
  if(!session) throw new Error('Unauthorized')
  if(!session.user.projectId) throw new Error('Unauthorized')
  
  // Parse price if provided
  const priceInFiat = price ? parseFloat(price) : undefined
  
  // Validate price if provided
  if (price && (isNaN(priceInFiat!) || priceInFiat! < 0)) {
    throw new Error('Invalid price value')
  }
  
  let imageUrl: string | undefined = undefined
  
  // Handle image upload if FormData provided
  if (imageFormData) {
    try {
      // Extract the file from FormData
      const imageFile = imageFormData.get('image') as File
      if (imageFile && imageFile instanceof File) {
        imageUrl = await uploadImageToS3(imageFile, session.user.projectId)
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      throw new Error('Failed to upload image')
    }
  }
  
  const product = await db.insert(products).values({
    name,
    projectId: session.user.projectId,
    priceInFiat: priceInFiat,
    images: imageUrl ? [imageUrl] : undefined,
    currency: 'USD'
  }).returning({
    id: products.id
  })
  
  if(!product || !product[0]?.id) throw new Error('Failed to create product')
  
  const link = await db.insert(paymentLinks).values({
    projectId: session.user.projectId,
    link: `${DOMAIN}/product/${product[0].id}/pay`
  }).returning({
    id: paymentLinks.id,
    link: paymentLinks.link
  })
  
  return link
}

// AWS S3 Image upload function using SST resources
async function uploadImageToS3(file: File, projectId: string): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
  }
  
  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size too large. Maximum 5MB allowed.')
  }
  
  // Convert File to Buffer for server-side processing
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Generate unique filename with proper path structure
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const uniqueId = nanoid()
  const fileName = `payment-links/${projectId}/${uniqueId}.${fileExtension}`
  
  try {
    // Get bucket name from SST resource - Fixed this line
    const bucketName = Resource.PaymentImagesBucket.name
    
    // S3 upload parameters
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'uploaded-by': projectId,
        'original-name': file.name,
        'upload-date': new Date().toISOString(),
      }
    }
    
    // Upload to S3
    const command = new PutObjectCommand(uploadParams)
    await s3Client.send(command)
    
    // Use direct S3 URL
    const region = process.env.AWS_REGION || 'us-east-1'
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`
    
    // Alternative: Use CloudFront CDN URL (better performance - uncomment if using CDN)
    // const cdnDomain = Resource.PaymentImagesCDN.domainName
    // const publicUrl = `https://${cdnDomain}/${fileName}`
    
    return publicUrl
  } catch (error) {
    console.error('S3 upload error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload image to S3: ${errorMessage}`)
  }
}

// Updated fetchPaymentLinks to include product details
export const fetchPaymentLinks = async (projectId: string) => {
  if (!projectId) throw new Error("Project ID is required")
  
  try {
    const links = await db
      .select({
        id: paymentLinks.id,
        projectId: paymentLinks.projectId,
        link: paymentLinks.link,
        createdAt: paymentLinks.createdAt,
        updatedAt: paymentLinks.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          priceInFiat: products.priceInFiat,
          currency: products.currency,
          images: products.images,
          description: products.description
        }
      })
      .from(paymentLinks)
      .leftJoin(products, eq(paymentLinks.link, `${DOMAIN}/product/${products.id}/pay`))
      .where(eq(paymentLinks.projectId, projectId))
      
    return links
  } catch (error) {
    console.error("Error fetching payment links:", error)
    throw new Error("Failed to fetch payment links")
  }
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