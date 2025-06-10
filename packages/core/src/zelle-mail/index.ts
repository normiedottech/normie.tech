import { db } from "@/database"
import { liquidityProviders, liquidityAndPayoutAddressesSettings, zelleTransactions, liquidityProviderSelectSchema, payoutSettingRelations, transactions, zellePaymentsMetadata } from "@/database/schema"
import { eq, gte, asc, desc, sql, and,ne } from "drizzle-orm"
import { z } from "zod";

export class ZelleMail {
  static FALLBACK_TO_LIQUIDITY = false 
  constructor() {}

  static async quoteOrder(amountOutInFiat: number,payoutAddress: string):Promise<{amountOut: number,amountIn: number, randomAmount: number, liquidityProvider: z.infer<typeof liquidityProviderSelectSchema>}> {
    const liquidityProvider = await ZelleMail.getLiquidityProvider(amountOutInFiat,payoutAddress);
    const paymentAmount = parseFloat((amountOutInFiat * (1 + liquidityProvider.feesPercentage / 100)).toFixed(2));
    const {amount: finalAmount, randomAmount} = await ZelleMail.generateUniqueAmount(paymentAmount,0);

    return {
        amountIn: finalAmount,
        amountOut: amountOutInFiat,
        randomAmount,
        liquidityProvider
    }
  }

  static async getLiquidityProvider(amountInFiat: number,payoutAddress: string){
    const liquidityAndPayoutAddressesSetting = await db.query.liquidityAndPayoutAddressesSettings.findFirst({
        where:eq(liquidityAndPayoutAddressesSettings.payoutAddress, payoutAddress.toLowerCase())
    })
    console.log({liquidityAndPayoutAddressesSetting})
    if(liquidityAndPayoutAddressesSetting && !liquidityAndPayoutAddressesSetting.active){
        throw new Error("Payout address is not active")
    }
    if(liquidityAndPayoutAddressesSetting){
        if(!liquidityAndPayoutAddressesSetting.liquidityProviderId){
            throw new Error("Liquidity provider not found")
        }
        const liquidityProvider = await db.query.liquidityProviders.findFirst({
            where: eq(liquidityProviders.id, liquidityAndPayoutAddressesSetting.liquidityProviderId ?? '')
        })
        if(!liquidityProvider){
            throw new Error("Liquidity provider not found")
        }
        if(liquidityProvider.liquidityInFiat < amountInFiat){
            const liquidityProviderWithFallback = await db.query.liquidityProviders.findFirst({
                where: eq(liquidityProviders.isFallback, true)
            })
            if(!liquidityProviderWithFallback){
                throw new Error("No fallback liquidity provider found")
            }
            if(liquidityProviderWithFallback.liquidityInFiat < amountInFiat){
                throw new Error("Fallback liquidity provider has insufficient liquidity")
            }
            if(!ZelleMail.FALLBACK_TO_LIQUIDITY){
                throw new Error("Liquidity provider has insufficient liquidity")
            }
            return liquidityProviderWithFallback
        }
        if(liquidityProvider.riskPercentage >= 60){
            throw new Error("Liquidity provider has high risk")
        }
        return liquidityProvider
    }
    const liquidityWithinAmount = await db.query.liquidityProviders.findMany({
        where: and(
            gte(liquidityProviders.liquidityInFiat, amountInFiat),
            eq(liquidityProviders.active, true)
        ),
        with: {
            payoutAddressSettings:{
                where:eq(liquidityAndPayoutAddressesSettings.active,true)
            }
        },
        orderBy: [
            sql`(SELECT COUNT(1) FROM "liquidity_and_payout_addresses_settings" WHERE "liquidityProviderId" = ${liquidityProviders.id})`,
            desc(liquidityProviders.priority)
        ]
    });
    if(liquidityWithinAmount.length === 0 || !liquidityWithinAmount[0].id){
        throw new Error("No liquidity provider found")
    }
    await db.insert(liquidityAndPayoutAddressesSettings).values({
        payoutAddress: payoutAddress.toLowerCase(),
        liquidityProviderId: liquidityWithinAmount[0].id,
        totalVolumeInFiat: amountInFiat,
        active: true
    })
    return liquidityWithinAmount[0];
  }

  static async generateUniqueAmount(baseAmount: number, offsetPercentage: number = 0, attempt: number = 0): Promise<{ amount: number, randomAmount: number }> {
    if (attempt >= 3) {
      throw new Error("Could not generate unique amount after 3 attempts");
    }

    // Calculate base amount with offset percentage
    let finalAmount = baseAmount;
    if (offsetPercentage > 0) {
      finalAmount = parseFloat((baseAmount * ((100 - offsetPercentage) / 100)).toFixed(3));
    }

    let adjustedAmount = finalAmount;
    let randomAmount = 0;

    // Only add random cents if this is not the first attempt
    if (attempt > 0) {
      // Generate random amount between 1-30 cents
      const randomCents = Math.floor(Math.random() * 30) + 1;
      randomAmount = randomCents / 100;
      adjustedAmount = parseFloat((finalAmount + randomAmount).toFixed(2));
    }

    // Check if this amount exists in the last 12 hours
    const existingTransaction = (await db.query.zellePaymentsMetadata.findMany({
      where: and(
        eq(zellePaymentsMetadata.amount, adjustedAmount),
        gte(zellePaymentsMetadata.createdAt, new Date(Date.now() - 12 * 60 * 60 * 1000)),
        ne(zellePaymentsMetadata.confirmationStatus,"payment-confirmed-by-admin")
      )
    }))

    if (existingTransaction && existingTransaction.length > 0) {
      // If amount exists, try again with a different random amount
      return ZelleMail.generateUniqueAmount(baseAmount, offsetPercentage, attempt + 1);
    }

    return { amount: adjustedAmount, randomAmount };
  }
}