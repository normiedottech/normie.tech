const www = new sst.aws.Nextjs("LandingPageNormieTech",{
    path:"packages/www",
    domain:$app.stage === "production" ? {
        name:"normie.tech",
        redirects:["www.normie.tech"]
    }: undefined,
})
export const outputs =  {
    landingPageDomain: www.url
}