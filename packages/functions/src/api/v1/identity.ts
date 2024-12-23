import { Hono } from "hono";
import { stripeVerificationSession } from "./[projectId]/[paymentId]/payments/stripe-checkout";
import Stripe from "stripe";
import { Resource } from "sst";
import { db } from "@normietech/core/database/index";
import { eq } from "drizzle-orm";
import { errorMessage, projects, users } from "@normietech/core/database/schema/index";

const identityApp = new Hono()
const stripeClient = new Stripe(Resource.STRIPE_API_KEY.value);
identityApp.post("/session", async (c) => {
    const body = await c.req.json<{userId:string,projectId:string,successUrl:string}>()
    console.log({body}) 
    const session = await stripeVerificationSession(body.userId,body.successUrl)
    return c.json({
        url:session.url
    })
})
identityApp.post("/webhook", async (c) => {
  const signature = c.req.header("Stripe-Signature");
  if (!signature) {
    return c.json({ error: "No signature provided" }, 400);
  }
  const body = await c.req.text();
  if (!body) {
    return c.json({ error: "No body provided" }, 400);
  }

  let webhookEvent;
  try {
    webhookEvent = stripeClient.webhooks.constructEvent(
      body,
      signature,
      Resource.IdentityWebhook.secret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.json({ error: "Webhook signature verification failed" }, 400);
  }

  console.log(
    `=======================================EVENT-${webhookEvent.type}-WEBHOOK=======================================`
  );

  switch (webhookEvent.type) {
    case "identity.verification_session.verified":{
        console.log("Verification session verified")
        const session = webhookEvent.data.object;
        const verificationSession = await stripeClient.identity.verificationSessions.retrieve(session.id,{
            expand:["verified_outputs"]
        });
        console.log(JSON.stringify(verificationSession,null,2))
        const metadata = verificationSession.metadata as  {userId:string,projectId:string}
        if(verificationSession.status === "verified" && metadata.userId && verificationSession.verified_outputs?.first_name && verificationSession.verified_outputs?.last_name){    
            console.log("Verification session verified")
            const fullName = `${verificationSession.verified_outputs.first_name} ${verificationSession.verified_outputs.last_name}`
            const user = await db.query.users.findFirst({
                where:eq(users.name,fullName)
            })

            if(user){
                await db.batch([
                    db.update(users).set({
                        onBoardStage:'kyc-completed',

                    }).where(eq(users.id,metadata.userId)),
                    db.update(projects).set({
                        fiatActive:false
                    }).where(eq(projects.projectId,metadata.projectId)),
                    db.insert(errorMessage).values({
                        projectId:metadata.projectId,
                        message:"User has already done KYC. If this is not the case, please contact support"
                    })
                ])
                return c.json({
                    message: "User has already done KYC",
                })
            }
            await db.batch([
                db.update(users).set({
                    onBoardStage:'kyc-completed',
                    name:fullName
                }).where(eq(users.id,metadata.userId)),
                db.update(projects).set({
                    fiatActive:true
                }).where(eq(projects.projectId,metadata.projectId)),

            ])
            return c.json({
                message: "KYC completed",
            })

            

        }
        break;
    }
  }
  return c.json({
    message: "Hello World",
 })
})
export default identityApp
