import { db } from "@normietech/core/database/index"
import {  isNotNull } from "drizzle-orm"
import chalk from "chalk"
import { payoutSettings, projects, users } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"

async function migrationScripts() {

    console.log(chalk.greenBright("Running Migration Scripts"))
    await db.transaction(async (tx) => {
        const allUsers = await tx.query.users.findMany()
        console.log(allUsers)
        for(const user of allUsers){
            if(user.projectId){
                console.log(chalk.greenBright(`Migrating user ${user.id}`))
      
                await tx.update(users).set({onBoardStage : "project-created"}).where(
                    eq(users.id,user.id)
                )
            }
            
        }
    })
    console.log(chalk.greenBright("Migration Scripts Completed"))
}
migrationScripts()