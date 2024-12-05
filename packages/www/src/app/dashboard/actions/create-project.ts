'use server'

import { db } from '@normietech/core/database/index'
import { projects, users } from '@normietech/core/database/schema/index'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import slugify from 'slugify'

export async function createProject(formData: FormData, userId: string) {
  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const payoutAddressOnEvm = formData.get('payoutAddressOnEvm') as string

  const id = nanoid(14)
  const projectId = slugify(name, { lower: true, strict: true ,trim:true})

  try {
    
    const project = await db.insert(projects).values({
        id,
        name,
        url,
        projectId,
        payoutAddressOnEvm
    })
    await db.update(users).set({
        projectId
    }).where(eq(users.id, userId))
  }
  catch (error  ) {
    if(error instanceof Error) {
        return { success: false, message: error.message }
    }
   
  }
  return { success: true, message: 'Project created successfully!' }
}

