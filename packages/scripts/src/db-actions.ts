import { db } from "@normietech/core/database/index"
import {  isNotNull } from "drizzle-orm"
import chalk from "chalk"
import { apiKeys, payoutSettings, projects, users } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
import { input, select } from '@inquirer/prompts';
import { Resource } from "sst"

type Choices = "deleteUserAndProject" | "deleteApiKeyByProjectId" | "updatePayoutOnEvmToPayoutSettings"

async function deleteApiKeyByProjectId(projectId:string) {
    return db.delete(apiKeys).where(eq(apiKeys.projectId,projectId))
}

async function deleteUserByEmail(email:string) {
    return db.delete(users).where(eq(users.email,email))
}
async function deleteProjectByProjectId(projectId:string) {
    return db.delete(projects).where(eq(projects.projectId,projectId))
}
async function askForConfirmation(message:string) {
    const answer = await select({
        choices:['yes','no'],
        message:message
    })
    return answer === "yes"
}
async function withConfirmation(message:string,fn:()=>Promise<void>){
    const confirm = await askForConfirmation(message)
    if(confirm){
        await fn()
    }
}
async function withDBConfirmation(fn:()=>Promise<void>){
    await withConfirmation(`You are using this db ${Resource.DATABASE_URL.value}`,fn)
}
async function dbActions() {

    console.log(chalk.greenBright("DB ACTIONS STARTED"))
    
    const answer =await select({
        choices:['deleteUserAndProject','deleteApiKeyByProjectId'],
        message:"Select an action to perform"
    })
    switch(answer as Choices){
       
        case "deleteApiKeyByProjectId":
            withDBConfirmation(
                async ()=>{
                    const projectId = await input({ message: 'Enter your projectID' });
                    await deleteApiKeyByProjectId(projectId)
                }
            )
            break
        
        case "deleteUserAndProject":
            withDBConfirmation(async ()=>{
                const email = await input({ message: 'Enter your email' });
            
                const res = await db.query.users.findFirst({
                    where:eq(users.email,email),
                    columns:{
                        projectId:true
                    }
                })
                if(!res || !res.projectId){
                    console.log(chalk.redBright("No user found with that email or no project id was found"))
                    return
                }
                await deleteUserByEmail(email)
                await deleteProjectByProjectId(res.projectId)
                await deleteApiKeyByProjectId(res.projectId)
            })
            break
          
          
    }
    
    console.log(chalk.greenBright("DB ACTIONS ENDED"))
    
}
dbActions()