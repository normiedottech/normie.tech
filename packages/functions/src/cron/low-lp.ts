import { db } from "@normietech/core/database/index";
import { liquidityProviders } from "@normietech/core/database/schema/index";
import { InternalEvents } from "@normietech/core/event";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { eq, lt, and, or, isNull } from "drizzle-orm";

export async function handler() {
  // Calculate the threshold time (12 hours ago)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const lowLiquidityProviders = await db.query.liquidityProviders.findMany({
    where: and(
      eq(liquidityProviders.active, true),
      lt(liquidityProviders.liquidityInFiat, 500), // Adjusted threshold to $500 for low liquidity
      // Only include providers who haven't been notified in the last 12 hours
      or(
        isNull(liquidityProviders.lastLowLiquidityNotified),
        lt(liquidityProviders.lastLowLiquidityNotified, twentyFourHoursAgo)
      )
    ),
  });

  if (lowLiquidityProviders.length > 0) {
    const currentTime = new Date();
    for (const provider of lowLiquidityProviders) {
      if (provider.email) {
        try {
          // Send email notification using ONZA API key
          await bus.publish(Resource.InternalEventBusV1.name, InternalEvents.Email.SendOnza, {
            to: [provider.email],
            subject: "Low Liquidity Alert - Action Required",
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">⚠️ Low Liquidity Alert</h2>
                <p>Dear Liquidity Provider,</p>
                <p>Your current liquidity balance is <strong style="color: #e74c3c;">$${provider.liquidityInFiat?.toFixed(2) || '0.00'}</strong>, which is below the minimum threshold of $500.00.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Immediate action required:</strong> Please add more funds to your account to continue processing transactions smoothly.</p>
                </div>
                <p>Provider Details:</p>
                <ul>
                  <li><strong>Provider Zelle Name:</strong> ${provider.zelleName || 'N/A'}</li>
                  <li><strong>Email:</strong> ${provider.email}</li>
                  <li><strong>Wallet Address:</strong> ${provider.walletAddress || 'N/A'}</li>
                  <li><strong>Provider ID:</strong> ${provider.id}</li>
                  <li><strong>Current Liquidity:</strong> $${provider.liquidityInFiat?.toFixed(2) || '0.00'}</li>
                </ul>
                <p><small>You will only receive this notification once every 24 hours while your liquidity remains low.</small></p>
                <p>Best regards,<br><strong>Onza Team</strong></p>
              </div>
            `
          });

          // Update the lastLowLiquidityNotified timestamp
          await db.update(liquidityProviders)
            .set({ lastLowLiquidityNotified: currentTime })
            .where(eq(liquidityProviders.id, provider.id));

          console.log(`Low liquidity email sent to provider ${provider.id} (${provider.email})`);
        } catch (error) {
          console.error(`Failed to send email to provider ${provider.id}:`, error);
        }
      }
    }

    // Log the alert for monitoring
    console.log(`Low liquidity alert sent to ${lowLiquidityProviders.length} providers at ${currentTime.toISOString()}`);

    // Optionally send a summary to admin via Telegram
    await bus.publish(Resource.InternalEventBusV1.name, InternalEvents.Telegram.Send, {
      chatId: "-4775660107",
      message: `📉 Low Liquidity Alert: ${lowLiquidityProviders.length} providers notified about liquidity below $500.00. Next notifications will be sent after 24 hours if liquidity remains low.`
    });
  } else {
    console.log(`No new low liquidity providers to notify at ${new Date().toISOString()}`);
  }
}