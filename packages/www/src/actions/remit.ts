"use server"

import { db } from "@normietech/core/database/index"

import { DOMAIN } from "@/lib/constants"
import { paymentLinks, products, transactions } from "@normietech/core/database/schema/index"
import { getTranslations } from "next-intl/server"
import { ZellePhoenixRemittance } from "@normietech/core/remit/index"

export const createRemitPaymentLink  = async (payoutAddress:string,projectId:string = ZellePhoenixRemittance.PROJECT_ID) => {
    const text = await getTranslations('RemittanceProductLink');
    const product = await db.insert(products).values({
      name:text('title'),
      projectId:projectId,
    }).returning({
      id:products.id
    })
    
    const link = await db.insert(paymentLinks).values({
      projectId:projectId,
      link:`${DOMAIN}/product/${product[0].id}/pay?payoutAddress=${payoutAddress}`
    }).returning({
      link:paymentLinks.link
    })
    return link
  }