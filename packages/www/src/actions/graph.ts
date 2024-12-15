"use server"
import { auth } from "@/server/auth"
import { db } from "@normietech/core/database/index"

export const getTransactions = async () => {
    const session =await auth()
    if (session?.user.projectId === "testett" || session?.user.projectId === "testtest") {
        return db.query.transactions.findMany({
            limit:500,
    
        })
    }
    return []
    
}