// "use server"

// import twilio from "twilio"

// const client = twilio(
//     "here some id",
//     "auth token"
// )

// const otpStore: Map<string, { otp: string; expires: number }> = new Map()

// function generateOTP(): string {
//   // return Math.floor(100000 + Math.random() * 900000).toString()
// }
// export async function sendWhatsAppOTP(phone: string) {
//     if (!phone) {
//       return { success: false, error: "Phone number is required" }
//     }
  
//     const normalizedPhone = phone.replace(/[\s()-]/g, "")
//     if (!normalizedPhone.startsWith("+")) {
//       return { success: false, error: "Phone number must include country code (e.g., +1)" }
//     }
  
//     const otp = generateOTP()
//     const expires = Date.now() + 5 * 60 * 1000 
  
//     try {
//       const message = await client.messages.create({
//         body: `Your OTP is ${otp}. It expires in 5 minutes.`,
//         from: "whatsapp:+14155238886", 
//         to: `whatsapp:${normalizedPhone}`,
//       })
  
//       otpStore.set(normalizedPhone, { otp, expires })
//       console.log(`OTP sent to ${normalizedPhone}: ${otp}, SID: ${message.sid}`)
  
//       return { success: true }
//     } catch (error) {
//       console.error("Failed to send OTP:", error)
//       return { success: false, error: "Failed to send OTP" }
//     }
//   }
  
//   export async function verifyWhatsAppOTP(phone: string, otp: string) {
//     if (!phone || !otp) {
//       return { success: false, error: "Phone number and OTP are required" }
//     }
  
//     const normalizedPhone = phone.replace(/[\s()-]/g, "")
  
//     const stored = otpStore.get(normalizedPhone)
//     if (!stored) {
//       console.log(`No OTP found for phone: ${normalizedPhone}`)
//       return { success: false, error: "No OTP found for this phone number" }
//     }
  
//     if (Date.now() > stored.expires) {
//       otpStore.delete(normalizedPhone)
//       console.log(`OTP expired for phone: ${normalizedPhone}`)
//       return { success: false, error: "OTP has expired" }
//     }
  
//     if (stored.otp !== otp) {
//       console.log(`Invalid OTP for phone: ${normalizedPhone}, provided: ${otp}, stored: ${stored.otp}`)
//       return { success: false, error: "Invalid OTP" }
//     }
  
//     otpStore.delete(normalizedPhone)
//     console.log(`OTP verified for phone: ${normalizedPhone}`)
//     return { success: true }
//   }