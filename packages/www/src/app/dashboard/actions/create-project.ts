"use server";

import { db } from "@normietech/core/database/index";
import {
  apiKeys,
  payoutBalance,
  payoutSettings,
  projects,
  users,
} from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import slugify from "slugify";
import { generateAPIKey } from "@/server/utils";
import { auth, unstable_update } from "@/server/auth";
import { cookies } from "next/headers";

export async function createProject(formData: FormData, userId: string) {
  const cookieStore = await cookies();
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const fullName = formData.get("full-name") as string;

  const expectedMonthlyVolume = formData.get("expectedMonthlyVolume")
    ? Number(formData.get("expectedMonthlyVolume"))
    : undefined;
  const industry = formData.get("industry") as string | undefined;
  const refferal = cookieStore.get("referral")?.value;
  const id = nanoid(14);
  let projectId = slugify(name, { lower: true, strict: true, trim: true });
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.projectId, projectId),
  });

  if (existingProject) {
    projectId = `${projectId}-${nanoid(4)}`;
  }
  try {
    const project = await db.insert(projects).values({
      id,
      name,
      url,
      projectId,
      referral: refferal,
      expectedMonthlyVolume,
      industry: industry,
      fiatActive: false,
    });
    console.log({
      id,
      name,
      url,
      projectId,
      referral: refferal,
      expectedMonthlyVolume,
      industry: industry, 
    })
    const key = generateAPIKey();
    console.log({key})

    await db.batch([
      db.insert(apiKeys).values({
          apiKey: key,
          projectId,
          planId: "qwuvlj0ucqqr3",
        }),
        db
        .update(users)
        .set({
          projectId,
          name: fullName,
      
          onBoardStage: "project-created",
        })
        .where(eq(users.id, userId)),
        db.insert(payoutBalance).values({
          projectId: projectId,
        })
    ])


    await unstable_update({
      user: {
        projectId,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      return { success: false, message: error.message };
    }
  }
  return { success: true, message: "Project created successfully!" };
}
