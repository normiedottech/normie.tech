import { db } from "@normietech/core/database/index";
import { transactions } from "@normietech/core/database/schema/index";
import { sendMessage } from "@normietech/core/telegram";
import { eq, gte, and,or } from "drizzle-orm";

export async function handler() {
   const fiveMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
   
   const failedTransactions = await db.query.transactions.findMany({
    where: or(
        and(
      eq(transactions.status, "failed"),
      gte(transactions.createdAt, fiveMinutesAgo)
    ),
    and(
        eq(transactions.status, "cancelled"),
        gte(transactions.createdAt, fiveMinutesAgo)
    ),
    and(
        eq(transactions.status, "fiat-confirmed"),
        gte(transactions.createdAt, fiveMinutesAgo)
    )
    ),
   });
   if(failedTransactions.length > 0) {
    for (const transaction of failedTransactions) {
        
        await sendMessage({
            chatId: "-4775660107",
            text: `Found ${failedTransactions.length} failed transactions in the last 5 minutes`,
        });
    }
   }
}
  