"use server"
import { eq } from "drizzle-orm";
import { zellePaymentsMetadata } from "@normietech/core/database/schema/index";
import { db } from "@normietech/core/database/index";
import { auth } from "@/server/auth";

export async function fetchZelleMetadata(transactionId:string){

  const metadata = await db.query.zellePaymentsMetadata.findFirst({
    where: eq(zellePaymentsMetadata.transactionId, transactionId),
  })
  
  return metadata
}
export async function updateZelleMetadata(transactionId:string, metadata:typeof zellePaymentsMetadata.$inferInsert){
  const user = await auth()
  if(!user){
    throw new Error("Unauthorized")
  }
  if(!user.user.isAdmin){
    throw new Error("Unauthorized")
  }

  await db.update(zellePaymentsMetadata).set(metadata).where(eq(zellePaymentsMetadata.transactionId, transactionId))
}
export async function updateZelleToGetDetail(transactionId:string){
    await db.update(zellePaymentsMetadata).set({
       confirmationStatus:"wait-for-payment-details"
    }).where(eq(zellePaymentsMetadata.transactionId, transactionId))
}

export async function updateZelleToConfirmPayment(transactionId:string){
    await db.update(zellePaymentsMetadata).set({
        confirmationStatus:"payment-confirmed-by-sender"
    }).where(eq(zellePaymentsMetadata.transactionId, transactionId))
}
