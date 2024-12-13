'use server'


import { db } from '@normietech/core/database/index'
import { transactions } from '@normietech/core/database/schema/index'
import { sql } from 'drizzle-orm'


export type ReferralStat = {
  referral: string 
  totalFees: number
}

export async function getReferralStats(): Promise<ReferralStat[]> {
  try {
    const referralStats = await db
      .select({
        referral: transactions.referral,
        totalFees: sql<number>`SUM(${transactions.referralFeesInFiat})`.as('totalFees'),
      })
      .from(transactions)
      .groupBy(transactions.referral)
      .orderBy(sql`SUM(${transactions.referralFeesInFiat})`)
      .execute()

    return referralStats
      .filter((stat) => stat.referral && stat.referral.trim() && stat.totalFees)
      .map((stat) => ({ referral: stat.referral as string, totalFees: stat.totalFees }))
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    throw new Error('Failed to fetch referral stats')
  }
}

