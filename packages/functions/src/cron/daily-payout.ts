import { db } from "@normietech/core/database/index";
import { payoutSettings } from "@normietech/core/database/schema/index";
import { InternalEvents } from "@normietech/core/event";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { Resource } from "sst";
import { bus } from "sst/aws/bus";

export async function handler() {
    let dailyPayoutSettings = await db.query.payoutSettings.findMany({
        where: and(
        eq(payoutSettings.payoutPeriod, "daily"), 
        eq(payoutSettings.settlementType,"payout"),
        eq(payoutSettings.isActive,true),
        isNotNull(payoutSettings.projectId),
    ),
    orderBy: [desc(payoutSettings.priority)]
    });
    

    if(dailyPayoutSettings.length === 0) {
        console.warn("No daily payout settings found")
        return
    }
    dailyPayoutSettings.forEach(async (payoutSetting) => {
        if(!payoutSetting.projectId) {
            console.warn("No project id found for payout setting", payoutSetting.id)
            return
        }
        await bus.publish(Resource.InternalEventBusV1.name, InternalEvents.Payout.Create, {
            projectId: payoutSetting.projectId
        })
    })
    console.log(`Daily payout created added to queue for ${dailyPayoutSettings.length} projects`)
}