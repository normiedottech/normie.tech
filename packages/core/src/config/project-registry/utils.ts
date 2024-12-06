import { db } from "../../database/index"
import { projects, projectsSelectSchema } from "../../database/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"


export const getProjectById = z.function().args(z.string()).returns(z.promise(projectsSelectSchema)).implement(async (projectId) => {
    const res = await db.query.projects.findFirst({
        where:eq(projects.projectId,projectId)
    })
    if(!res) throw new Error('Project not found')
    return res 
})
