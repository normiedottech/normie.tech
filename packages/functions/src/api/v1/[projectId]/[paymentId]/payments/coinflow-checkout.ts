import { checkoutBodySchema, ProjectRegistryKey } from "@normietech/core/config/project-registry/index"
import { transactions } from "@normietech/core/database/schema/index"
import { z } from "zod"

const coinflowApi = "https://api.coinflow.cash"
export const coinflowCheckout = async (bodyRaw:string,body:z.infer<typeof checkoutBodySchema>,projectId: ProjectRegistryKey,transaction: typeof transactions.$inferInsert | undefined,metadataId:string) =>{
    const email = body.customerEmail

    if(!email){
        throw  Error("Email is required")
    }
    
 
    // console.log(JSON.stringify(url))
}