"use server";
import "server-only";
import { auth } from "@/server/auth";
import { db } from "@normietech/core/database/index";
import {
  payoutBalance,
  payoutSettings,
  payoutTransactions,
  users,
} from "@normietech/core/database/schema/index";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { Resource } from "sst";

export type PayoutTransactions = typeof payoutTransactions.$inferSelect;
export type PayoutBalance = typeof payoutBalance.$inferSelect;
export type PayoutSettings = typeof payoutSettings.$inferSelect;
export async function createPayoutSettings({
  payoutPeriod,
  blockchain,
  chainId,
  payoutAddress,
  settlementType,
}:Omit<typeof payoutSettings.$inferInsert,"id" | "isActive" | "projectId" | "createdAt" | "updatedAt">) {
  const session = await auth();
  if (!session || !session.user.projectId) {
    return { success: false, message: "User not authenticated" };
  }
  const [userPayoutSettings, userBalance] = await db.batch([
    db.query.payoutSettings.findFirst({
      where: and(
        eq(payoutSettings.projectId, session.user.projectId),
        eq(payoutSettings.isActive, true)
      ),
    }),
    db.query.payoutBalance.findFirst({
      where: eq(payoutBalance.projectId, session.user.projectId),
    }),
  ]);
  if (userPayoutSettings) {
    return { success: false, message: "Payout settings already exists" };
  }
  await db.batch([
    db.insert(payoutSettings).values({
      payoutPeriod: payoutPeriod,
      blockchain: blockchain,
      chainId: chainId,
      payoutAddress: payoutAddress,
      settlementType: settlementType,
      isActive: true,
      projectId: session.user.projectId,
    }),
    db
      .update(users)
      .set({
        onBoardStage: "payout-created",
      })
      .where(eq(users.id, session.user.id!)),
  ]);

  return { success: true, message: "Payout settings added successfully!" };
}
export async function getPayoutTransactions() {
  const session = await auth();
  if (!session) {
    throw new Error("User not authenticated");
  }
  if (!session?.user.projectId) {
    throw new Error("User does not have a project");
  }
  const usersPayoutSettings = await db.query.payoutSettings.findFirst({
    where: and(
      eq(payoutSettings.projectId, session.user.projectId),
      eq(payoutSettings.isActive, true)
    ),
  });
  if (!usersPayoutSettings) {
    throw new Error("Payout settings not found");
  }
  const userPayoutTransactions = await db.query.payoutTransactions.findMany({
    where: and(
      eq(payoutTransactions.projectId, session.user.projectId),
      eq(payoutTransactions.payoutSettings, usersPayoutSettings.id)
    ),
  });

  return userPayoutTransactions;
}

export async function getPayoutBalance() {
  const session = await auth();
  if (!session) {
    throw new Error("User not authenticated");
  }
  if (!session?.user.projectId) {
    throw new Error("User does not have a project");
  }
  const balance = await db.query.payoutBalance.findFirst({
    where: eq(payoutBalance.projectId, session.user.projectId),
  });
  if (!balance) {
    throw new Error("Payout balance not found");
  }
  return balance;
}

export async function getPayoutSettings() {
  const session = await auth();
  if (!session) {
    throw new Error("User not authenticated");
  }
  if (!session?.user.projectId) {
    throw new Error("User does not have a project");
  }
  const usersPayoutSettings = await db.query.payoutSettings.findFirst({
    where: and(
      eq(payoutSettings.projectId, session.user.projectId),
      eq(payoutSettings.isActive, true)
    ),
  });
  if (!usersPayoutSettings) {
    throw new Error("Payout settings not found");
  }

  return usersPayoutSettings;
}

export async function initiatePayout() {
  const session = await auth();
  if (!session) {
    throw new Error("User not authenticated");
  }
  if (!session?.user.projectId) {
    throw new Error("User does not have a project");
  }
  const usersPayoutSettings = await db.query.payoutSettings.findFirst({
    where: and(
      eq(payoutSettings.projectId, session.user.projectId),
      eq(payoutSettings.isActive, true)
    ),
  });
  if (!usersPayoutSettings) {
    throw new Error("Payout settings not found");
  }
  const balance = await db.query.payoutBalance.findFirst({
    where: eq(payoutBalance.projectId, session.user.projectId),
  });
  const resend = new Resend(Resource.RESEND_API_KEY.value);

  if (usersPayoutSettings.blockchain === "tron") {
    await db.insert(payoutTransactions).values({
      payoutSettings: usersPayoutSettings.id,
      projectId: session.user.projectId,
      amountInFiat: balance?.balance,
      status: "pending",
    });
    await resend.emails.send({
      from: "Notification <support@normie.tech>",
      subject: "Payout Initiated Request",
      to: "support@normie.tech",
      html: `<p>Project ${session.user.projectId} has initiated a payout request</p>`,
    });
    return {
      success: true,
      message: "Payout request sent , please wait for at most 2 days",
    };
  } else if (usersPayoutSettings.blockchain === "arbitrum-one") {
  }

  return { success: true, message: "Payout initiated successfully" };
}
