import { db } from "@normietech/core/database/index";
import { liquidityProviders } from "@normietech/core/database/schema/index";
import { InternalEvents } from "@normietech/core/event"; // Adjust path as needed
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { eq, lt, and } from "drizzle-orm";

export async function handler() {
  const lowLiquidityProviders = await db.query.liquidityProviders.findMany({
    where: and(
      eq(liquidityProviders.active, true),
      lt(liquidityProviders.liquidityInFiat, 500)
    ),
  });

  if (lowLiquidityProviders.length > 0) {
    for (const provider of lowLiquidityProviders) {
      if (provider.email) {
        await bus.publish(Resource.InternalEventBusV1.name, InternalEvents.Email.Send, {
          to: [provider.email],
          subject: "Low Liquidity Alert - Action Required",
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">⚠️ Low Liquidity Alert</h2>
              <p>Dear Liquidity Provider,</p>
              <p>Your current liquidity balance is <strong style="color: #e74c3c;">${provider.liquidityInFiat?.toFixed(2) || '0.00'}</strong>, which is below the minimum threshold of $1.00.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                <p style="margin: 0;"><strong>Immediate action required:</strong> Please add more funds to your account to continue processing transactions smoothly.</p>
              </div>
              <p>Provider Details:</p>
              <ul>
                <li><strong>Provider ID:</strong> ${provider.id}</li>
                <li><strong>Current Liquidity:</strong> ${provider.liquidityInFiat?.toFixed(2) || '0.00'}</li>
                <li><strong>Risk Percentage:</strong> ${provider.riskPercentage}%</li>
                <li><strong>Priority Level:</strong> ${provider.priority}</li>
              </ul>
              <p>Best regards,<br><strong>The Platform Team</strong></p>
            </div>
          `
        });
      }
    }
    
    // Log the alert for monitoring
    console.log(`Low liquidity alert sent to ${lowLiquidityProviders.length} providers at ${new Date().toISOString()}`);
    
    // Optionally send a summary to admin via Telegram (similar to your failed transactions pattern)
    await bus.publish(Resource.InternalEventBusV1.name, InternalEvents.Telegram.Send, {
      chatId: "-4775660107", // Use your admin chat ID
      message: `📉 Low Liquidity Alert: ${lowLiquidityProviders.length} providers have less than $1 in liquidity. Email notifications sent.`
    });
  } else {
    console.log(`No low liquidity providers found at ${new Date().toISOString()}`);
  }
}