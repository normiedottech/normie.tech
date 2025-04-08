import { secrets } from "./secrets";

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

export const outputs = {
    checkFailedPayments: checkFailedPayments.urn
}