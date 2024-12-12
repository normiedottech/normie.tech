import { router } from "./api"
import { secrets } from "./secrets"

const www = new sst.aws.Nextjs("LandingPageNormieTech",{
    path:"packages/www",
    domain:$app.stage === "production" ? {
        name:"normie.tech",
        redirects:["www.normie.tech"]
    }: $app.stage === "development" ? {
        name:"dev.normie.tech"
    } : undefined,
    link:[
        secrets.NEXT_PUBLIC_POSTHOG_KEY,
        secrets.NEXT_PUBLIC_POSTHOG_HOST,
        secrets.BETTER_AUTH_SECRET,
        secrets.RESEND_API_KEY,
        secrets.DATABASE_URL,
        router
    ],
    environment:{
        NEXT_PUBLIC_POSTHOG_KEY:secrets.NEXT_PUBLIC_POSTHOG_KEY.value,
        NEXT_PUBLIC_POSTHOG_HOST:secrets.NEXT_PUBLIC_POSTHOG_HOST.value,
        NEXT_PUBLIC_API_URL:$app.stage === "production" ? "https://api.normie.tech" : router.url,
        NEXT_PUBLIC_STAGE: $app.stage,
        API_URL:$app.stage === "production" ? "https://api.normie.tech" : router.url,
        STAGE: $app.stage,

    }
})
export const outputs =  {
    landingPageDomain: www.url
}