import { router } from "./api"
import { secrets } from "./secrets"

const www = new sst.aws.Nextjs("LandingPageNormieTechV1",{
    path:"packages/www",


    domain:$app.stage === "production" ? {
        name:"normie.tech",
        redirects:["www.normie.tech"]
    }: $app.stage === "dev" ? {
        name:"dev.normie.tech"
    } : $app.stage === "sandbox" ? {
        name:"sandbox.normie.tech"
    } : $app.stage === "pyusd" ? {
        name:"pyusd.normie.tech"
    } : undefined,
    link:[
        secrets.NEXT_PUBLIC_POSTHOG_KEY,
        secrets.NEXT_PUBLIC_POSTHOG_HOST,
        secrets.BETTER_AUTH_SECRET,
        secrets.RESEND_API_KEY,
        secrets.DATABASE_URL,
        secrets.PAYPAL_CLIENT_ID,
        secrets.DEPOSYT_PRIVATE_KEY,
        secrets.DEPOSYT_PUBLIC_KEY,
        secrets.DEPOSYT_PUBLIC_CHECKOUT_KEY,
        router
    ],
    environment:{
        NEXT_PUBLIC_POSTHOG_KEY:secrets.NEXT_PUBLIC_POSTHOG_KEY.value,
        NEXT_PUBLIC_POSTHOG_HOST:secrets.NEXT_PUBLIC_POSTHOG_HOST.value,
        NEXT_PUBLIC_API_URL:$app.stage === "production" ? "https://api.normie.tech" : router.url,
        NEXT_PUBLIC_STAGE: $app.stage,
        API_URL:$app.stage === "production" ? "https://api.normie.tech" : router.url,
        STAGE: $app.stage,
        NEXT_PUBLIC_PAYPAL_CLIENT_ID:secrets.PAYPAL_CLIENT_ID.value,
        NEXT_PUBLIC_DEPOSYT_PUBLIC_KEY:secrets.DEPOSYT_PUBLIC_KEY.value,
        NEXT_PUBLIC_DEPOSYT_PUBLIC_CHECKOUT_KEY:secrets.DEPOSYT_PUBLIC_CHECKOUT_KEY.value,
    }
})
export const outputs =  {
    landingPageDomain: www.url
}