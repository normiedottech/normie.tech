import { betterAuth } from "better-auth";
import { Resource } from "sst";
import { bearer, emailOTP, jwt, magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "@normietech/core/database/index";
const resend = new Resend(Resource.RESEND_API_KEY.value);
export const auth = betterAuth({
    secret: Resource.BETTER_AUTH_SECRET.value,
    baseURL: Resource["API-V1"].url,
    database: drizzleAdapter(db,{
        provider:"pg"
    }),
    
    plugins:[
        jwt(),
        bearer(),
        emailOTP({
            async sendVerificationOTP({email,otp,type},request){
                if(type=="sign-in"){
                    const { data, error } = await resend.emails.send({
                        from:"Support <support@normie.tech>",
                        to:[email],
                        subject:"OTP to sign in to Normie Tech",
                        html:`<p>Your OTP to sign in to Normie Tech is <strong>${otp}</strong></p>`
                    })
                    if (error) {
                        throw new Error("Failed to send OTP")
                    }
                }
            }
        })
    ]
})