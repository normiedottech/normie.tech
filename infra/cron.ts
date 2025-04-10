import { internalEventBus } from "./event";
import { allSecrets, secrets } from "./secrets";

const checkFailedPayments = new sst.aws.Cron("CheckFailedPayments", {
    function:{
      handler: "packages/functions/src/cron/check-failed-payments.handler",
      link:[
        secrets.DATABASE_URL,
        secrets.TELEGRAM_BOT_TOKEN,
      ]
    },
    enabled:$app.stage === "production",
    schedule: "rate(5 minutes)",
    
});

const dailyPayout = new sst.aws.Cron("DailyPayout", {
    function:{
        handler: "packages/functions/src/cron/daily-payout.handler",
        link:[
          ...allSecrets,
          internalEventBus
        ]
    },
    enabled:$app.stage === "production",
    schedule: "rate(1 day)",
});
export const outputs = {
    checkFailedPayments: checkFailedPayments.urn,
    dailyPayout: dailyPayout.urn
}