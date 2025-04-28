import { db } from "@normietech/core/database/index";
import { referer, transactions, paymentUsers } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { count } from "drizzle-orm";

export async function updateReferralRewards(transactionId: string) {

    const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, transactionId),
    with: { paymentUser: true },
  });

  if (!transaction || !transaction.paymentUser || !transaction.amountInFiat) {
    console.log("Transaction or payment user not found, or amount missing");
    return;
  }

  const referredUser = await db.query.referer.findFirst({
    where: eq(referer.referralId, transaction.referral || ""),
  });

  if (!referredUser || !referredUser.referredBy) {
    console.log("Referred user not found or has no referrer");
    return;
  }

  const referrer = await db.query.referer.findFirst({
    where: eq(referer.referralId, referredUser.referredBy),
  });

  if (!referrer) {
    console.log("Referrer not found");
    return;
  }

  const referredCountResult = await db
    .select({ count: count() })
    .from(referer)
    .where(eq(referer.referredBy, referrer.referralId));

  const referredCount = referredCountResult[0].count;

  if (referredCount < 5) {
    console.log(`Referrer has only ${referredCount} referrals, less than 5`);
    return;
  }

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date((referredUser.createdAt || "")).getTime()) / (1000 * 60 * 60 * 24)
  );

  let percentage: number;
  if (ageInDays < 30) {
    percentage = 0.005;
  } else if (ageInDays < 90) {
    percentage = 0.0025; 
  } else if (ageInDays < 270) {
    percentage = 0.001;
  } else {
    percentage = 0;
  }

  console.log("percentage for referral based on how old his referral is", percentage);

  if (percentage > 0) {
    const reward = transaction.amountInFiat * percentage;
    await db
      .update(referer)
      .set({
        amountEarned: (referrer.amountEarned || 0) + reward,
        updatedAt: new Date(),
      })
      .where(eq(referer.referralId, referrer.referralId));
    console.log(`Added reward of $${reward} to referrer ${referrer.referralId}`);
  }
}