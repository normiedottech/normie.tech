import { Hono } from "hono";
import { z } from "zod";
import  {Despo}  from "@/core/deposyt";
const deposytCaptureOrderApp = new Hono();

export const deposytCaptureTransactionBodySchema = z.object({
    // Payment specific fields
    transactionId: z.string().min(1, "Transaction ID is required"),
    paymentToken: z.string().min(1, "Payment token is required"),
    
    // Customer information
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional(),
    
    // Address information
    address1: z.string().min(1, "Street address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State/Province is required"),
    zip: z.string().min(1, "ZIP code is required"),
    
    // Contact information
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    phone: z.string().optional(),
    

});

type DeposytCaptureTransactionBody = z.infer<typeof deposytCaptureTransactionBodySchema>;

deposytCaptureOrderApp.post("/", async (c) => {
    const body = await c.req.json();
    const validatedBody = deposytCaptureTransactionBodySchema.parse(body);
    const client = new DeposytClient(process.env.DEPOSYT_API_KEY!);

    // ... rest of your handler logic
});

export default deposytCaptureOrderApp;
