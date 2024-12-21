import { db } from "../../database/index"
import { payoutSettings, projects, projectsSelectSchema } from "../../database/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"


export const getProjectBalanceById = async (projectId: string) => {
    const res = await db.query.payoutBalance.findFirst({
        where:eq(payoutSettings.projectId,projectId)
    })
    if(!res) throw new Error('Project balance not found')
    return res
}
export const getPayoutSettings = async (projectId: string) => {
    const res =await  db.query.payoutSettings.findFirst({
        where:and(eq(payoutSettings.projectId,projectId),eq(payoutSettings.isActive,true))
    })
    if(!res) throw new Error('Payout settings not found')
    return res
}
export const getProjectById = z.function().args(z.string()).returns(z.promise(projectsSelectSchema)).implement(async (projectId) => {
    console.log('projectId',projectId)
    const res = await db.query.projects.findFirst({
        where:eq(projects.projectId,projectId),
        
    })
    if(!res) throw new Error('Project not found')
    return res 
})
