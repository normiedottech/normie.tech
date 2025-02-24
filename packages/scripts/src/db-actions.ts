import { db } from "@normietech/core/database/index"
import {  and, isNotNull, isNull } from "drizzle-orm"
import chalk from "chalk"
import { apiKeys, payoutBalance, payoutSettings, projects, projectSettings, users } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
import { input, select } from '@inquirer/prompts';
import { Resource } from "sst"

type Choices = "deleteUserAndProject" | "deleteApiKeyByProjectId" | "updatePayoutOnEvmToPayoutSettings" | "updateUserOnBoardStatus" | "updateProjectSettingsWithUser" | "createProjectSettingsForAllProjects"

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
        choices:['deleteUserAndProject','deleteApiKeyByProjectId','updatePayoutOnEvmToPayoutSettings','updateUserOnBoardStatus',"updateProjectSettingsWithUser",'createProjectSettingsForAllProjects'] as Choices[],
        message:"Select an action to perform"
    })
    switch(answer as Choices){
        case "updateProjectSettingsWithUser":
            withDBConfirmation(async()=>{
                const payouts = await db.query.payoutSettings.findMany({
                    where:and(
                        isNotNull(payoutSettings.projectId),
                        isNotNull(payoutSettings.payoutAddress)
                    )
                })
                const calls = []
                for(const payout of payouts){
                    if(payout.id){
                        calls.push(
                            db.update(users).set({
                                onBoardStage:"payout-created"
                            }).where(eq(users.projectId,payout.projectId))
                        )
                    }
                    
                }
                console.log("DONE WITH USER ONBOARD STATUS OF PAYOUT CREATED")
                console.log(`Updating ${calls.length} users`)
                await db.batch(calls as any)
            })
            break
        case "updateUserOnBoardStatus":
            withDBConfirmation(async()=>{
                const usersWithProject = await db.query.users.findMany({
                    where:isNotNull(users.projectId)
                })
                const updateProjectCreatedCalls = []
                for(const user of usersWithProject){

                    updateProjectCreatedCalls.push(
                        db.update(users).set({
                            onBoardStage:"project-created"
                        }).where(eq(users.id,user.id))
                    )
                }
                const usersWithOutProject = await db.query.users.findMany({
                    where:isNull(users.projectId)
                })
                const updateWithoutProject = [
                    
                ]
                for(const user of usersWithOutProject){
                    updateWithoutProject.push(
                        db.update(users).set({
                            onBoardStage:"no-project-created"
                        }).where(eq(users.id,user.id))
                    )
                }
                console.log("DONE WITH USER ONBOARD STATUS OF PROJECT CREATED")
                await db.batch([...updateProjectCreatedCalls,...updateWithoutProject] as any)
                console.log("DONE WITH USER ONBOARD STATUS OF PROJECT CREATED")
               
            })
        case "updatePayoutOnEvmToPayoutSettings":
            withDBConfirmation(
                async ()=>{
                    const usersWithProjectsAndPayoutAddress = await db.query.users.findMany({
                        where:isNotNull(users.projectId),
                        
                        
                    })
                    console.log(usersWithProjectsAndPayoutAddress)
                    for( const user of usersWithProjectsAndPayoutAddress ){
                        if(user.projectId){
                            const project = await db.query.projects.findFirst({
                                where:eq(projects.projectId,user.projectId)
                            })
                            if(project?.payoutAddressOnEvm){
                                await db.batch([
                                    db.insert(payoutSettings).values({
                                        payoutPeriod:"instant",
                                        blockchain:"arbitrum-one",
                                        chainId:42161,
                                        payoutAddress:project.payoutAddressOnEvm,
                                        settlementType:"payout",
                                        isActive:true,
                                        projectId:user.projectId
                                    }),
                                    db.insert(payoutBalance).values({
                                        projectId:user.projectId,
                                    })
                                ])
                            }
                            if(project?.settlementType === "smart-contract" && !project?.payoutAddressOnEvm){
                                await db.batch([
                                    db.insert(payoutSettings).values({
                                        payoutPeriod:"instant",
                                        blockchain:"evm",
                                        chainId:0,
                                       
                                        settlementType:"smart-contract",
                                        isActive:true,
                                        projectId:user.projectId
                                    }),
                                    db.insert(payoutBalance).values({
                                        projectId:user.projectId,
                                    })
                                ]) 
                            }
                        }
                    }
                }
            )
            break
       
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
        case "createProjectSettingsForAllProjects":
            withDBConfirmation(async()=>{
                const projects = await db.query.projects.findMany()
                let calls = []
                for(const project of projects){
                    calls.push(db.insert(projectSettings).values({
                        projectId:project.projectId,
                        showFeesInCheckout:false
                    }))
                }
                await db.batch(calls as any)
            })
        break;
          
    }
    
    console.log(chalk.greenBright("DB ACTIONS ENDED"))
    
}
dbActions()