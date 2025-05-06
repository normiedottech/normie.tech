"use server"

import { API_URL, DOMAIN } from "@/lib/constants"
import { auth } from "@/server/auth"
import { z } from "zod"

const productBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const planBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  interval: z.enum(['day', 'week', 'month', 'year']).default('month'),
  intervalCount: z.number().int().positive().default(1),
  metadata: z.record(z.any()).optional(),
})

const createPlanSchema = z.object({
  projectId: z.string(),
  product: productBodySchema.optional(),
  productId: z.string().optional(),
  plan: planBodySchema,
})

export async function createPlan(data: z.infer<typeof createPlanSchema>, apiKey: string) {

    const session = await auth();

    if (!session) {
        throw new Error("User not authenticated");
    }
    if (!session?.user.projectId) {
        throw new Error("User does not have a project");
    }

  const response = await fetch(`${API_URL}/v1/${session.user.projectId}/0/plan`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product: data.product,
      productId: data.productId,
      plan: data.plan,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create plan')
  }

  const result = await response.json()
  const planId = result.plan.id
  const url = `${DOMAIN}/checkout/subscription/${planId}`

  return {
    success: true,
    plan: result.plan,
    url,
  }
}