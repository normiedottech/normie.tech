'use server'

import { db } from '@normietech/core/database/index'
import { apiKeys, projects, users } from '@normietech/core/database/schema/index'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import slugify from 'slugify'
import {generateAPIKey} from "@/server/utils"
import { unstable_update } from '@/server/auth'
import { cookies } from 'next/headers'
export async function createProject(formData: FormData, userId: string) {
  const cookieStore = await cookies()
  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const fullName = formData.get('full-name') as string
  const payoutAddressOnEvm = formData.get('payoutAddressOnEvm') as string
  const refferal = cookieStore.get('referral')?.value
  const id = nanoid(14)
  let projectId = slugify(name, { lower: true, strict: true ,trim:true})
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.projectId, projectId)
  })

  if(existingProject){
    projectId = `${projectId}-${nanoid(4)}`
  }
  try {
    
    const project = await db.insert(projects).values({
        id,
        name,
        url,
        projectId,
        payoutAddressOnEvm,
        referral:refferal
    })
    const key = generateAPIKey()
    await db.update(users).set({
        projectId,
        name:fullName
    }).where(eq(users.id, userId))
    await db.insert(apiKeys).values({
      apiKey:key,
      projectId,
      planId:"qwuvlj0ucqqr3",
    })
    await unstable_update({
      user:{
        projectId
      }
    })
  }
  catch (error  ) {
    if(error instanceof Error) {
        return { success: false, message: error.message }
    }
   
  }
  return { success: true, message: 'Project created successfully!' }
}

