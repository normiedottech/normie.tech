"use server";

import { auth } from "@/server/auth";
import { db } from "@normietech/core/database/index";
import { referer, transactions } from "@normietech/core/database/schema/index";
import { count, eq } from "drizzle-orm";


export async function createReferral(data: {
  email?: string;
  phone: string;
  referredBy?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const existingReferral = await db.query.referer.findFirst({
    where: eq(referer.phone, data.phone),
  });

  if (existingReferral) {
    return { success: false, error: "Referral already exists for this phone number" };
  }

  if (data.referredBy) {
    const referrerExists = await db.query.referer.findFirst({
      where: eq(referer.referralId, data.referredBy),
    });
    if (!referrerExists) {
      return { success: false, error: "Invalid referral ID" };
    }

    if (referrerExists.phone === data.phone) {
      return { success: false, error: "Cannot refer yourself" };
    }
  }

  try {
    const [newReferral] = await db
      .insert(referer)
      .values({
        email: data.email,
        phone: data.phone,
        referredBy: data.referredBy || null,
      })
      .returning();

    return { success: true, data: newReferral };
  } catch (error) {
    return { success: false, error: "Failed to create referral" };
  }
}

export async function getReferralDetails() {

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userEmail = session.user.email;
  if (!userEmail) {
    return { success: false, error: "User email not found in session" };
  }

  const referral = await db.query.referer.findFirst({
    where: eq(referer.email, userEmail),
  });

  if (!referral) {
    return { success: false, error: "Referral not found" };
  }

  return { success: true, data: referral };
}


export async function getTotalReferredUsers(phone: string) {
    try {
      const referrer = await db.query.referer.findFirst({
        where: eq(referer.phone, phone),
        columns: { referralId: true },
      });
  
      if (!referrer) {
        return { success: false, error: "Referrer not found" };
      }
      const referredUsersCount = await db
        .select({ count: count() })
        .from(referer)
        .where(eq(referer.referredBy, referrer.referralId));
  
      return { success: true, data: referredUsersCount[0].count };
    } catch (error) {
      return { success: false, error: "Failed to fetch referred users count" };
    }
  }

export async function updateReferralMetrics(transactionId: string) {

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
  });

  if (!transaction || !transaction.referral) {
    return { success: false, error: "Transaction or referral not found" };
  }

  const referrer = await db.query.referer.findFirst({
    where: eq(referer.referralId, transaction.referral),
  });

  if (!referrer) {
    return { success: false, error: "Referrer not found" };
  }


  const referralPercentage = 0.05;
  const referralEarnings = (transaction.amountInFiat ?? 0) * referralPercentage;

  try {
    const [updatedReferrer] = await db
      .update(referer)
      .set({
        totalAmountPassed: referrer.totalAmountPassed + (transaction.amountInFiat ?? 0),
        amountEarned: referrer.amountEarned + referralEarnings,
        updatedAt: new Date(),
      })
      .where(eq(referer.referralId, referrer.referralId))
      .returning();

    return { success: true, data: updatedReferrer };
  } catch (error) {
    return { success: false, error: "Failed to update referral metrics" };
  }
}