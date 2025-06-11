import { db } from "@normietech/core/database/index"
import {  and, isNotNull, isNull } from "drizzle-orm"
import chalk from "chalk"
import { apiKeys, paymentProcessorInsertSchema, paymentProcessors, payoutBalance, payoutSettings, projects, projectSettings, users, liquidityAndPayoutAddressesSettings, liquidityProviders } from "@normietech/core/database/schema/index"
import { eq } from "drizzle-orm"
import { input, select ,rawlist} from '@inquirer/prompts';
import { Resource } from "sst"
import fs from 'fs'
import { parse } from 'csv-parse/sync'

type Choices = "decryptPrivateKeyInBulk"|"encryptPrivateKeyInBulk"|"decryptPrivateKey"|"encryptPrivateKey"| "createProjectAndUser"| "deleteUserAndProject" | "deleteApiKeyByProjectId" | "updatePayoutOnEvmToPayoutSettings" | "updateUserOnBoardStatus" | "updateProjectSettingsWithUser" | "createProjectSettingsForAllProjects" | "createPaymentProcessors" | "linkUserToProject" | "insertLiquidityPayoutSettings"
import crypto from 'crypto';
import { AESCipher } from "@normietech/core/util/encryption"
import { privateKeyToAccount } from "viem/accounts"
export function generateAPIKey(size = 32) {
    const buffer = crypto.randomBytes(size);
    return buffer.toString('base64');
}
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
        choices:['decryptPrivateKeyInBulk','encryptPrivateKeyInBulk','decryptPrivateKey','encryptPrivateKey','deleteUserAndProject','deleteApiKeyByProjectId','updatePayoutOnEvmToPayoutSettings','updateUserOnBoardStatus',"updateProjectSettingsWithUser",'createProjectSettingsForAllProjects','createPaymentProcessors','createProjectAndUser','linkUserToProject','insertLiquidityPayoutSettings'] as Choices[],
        message:"Select an action to perform"
    })
    switch(answer as Choices){
        case "decryptPrivateKeyInBulk":{
            const key = await input({ message: 'Enter your AES KEY' });
            const allPrivateKeys = await db.query.liquidityProviders.findMany({
                where:isNotNull(liquidityProviders.walletKey),
                columns:{
                    walletKey:true
                }
            }) 
            const cipher = new AESCipher(key);
            for(const privateKey of allPrivateKeys){
                const decryptedPrivateKey = cipher.decrypt(privateKey.walletKey as string);
                console.log(chalk.greenBright(`Private Key: ${decryptedPrivateKey}`))
                console.log(chalk.greenBright(`Address: ${privateKeyToAccount(decryptedPrivateKey as `0x${string}`).address}`))
            }
            break;
        }
        case "encryptPrivateKeyInBulk":{
            const key = await input({ message: 'Enter your AES KEY' });
            const numberOfKeys = await input({ message: 'Enter the number of keys to encrypt' });
            const allPrivateKeys = []
            for(let i = 0; i < Number(numberOfKeys); i++){
                const privateKey = await input({ message: 'Enter your private key' });
                allPrivateKeys.push(privateKey)
            }
            const cipher = new AESCipher(key);
            for(const privateKey of allPrivateKeys){
                const encryptedPrivateKey = cipher.encrypt(privateKey);
                console.log(chalk.greenBright(`Encrypted Private Key: ${encryptedPrivateKey}`))
                console.log(chalk.greenBright(`Address: ${privateKeyToAccount(privateKey as `0x${string}`).address}`))
            }
            break;
        }
        case "decryptPrivateKey":{
            const encryptedPrivateKey = await input({ message: 'Enter your encrypted private key' });
            const key = await input({ message: 'Enter your AES KEY' });
            const cipher = new AESCipher(key);
            const privateKey = cipher.decrypt(encryptedPrivateKey);
            console.log(chalk.greenBright(`Private Key: ${privateKey}`))
            console.log(chalk.greenBright(`Address: ${privateKeyToAccount(privateKey as `0x${string}`).address}`))
            break;
        }
        case "encryptPrivateKey":{
            const privateKey = await input({ message: 'Enter your private key' });
            const key = await input({ message: 'Enter your AES KEY' });
            const cipher = new AESCipher(key);
            const encryptedPrivateKey = cipher.encrypt(privateKey);
            console.log(chalk.greenBright(`Encrypted Private Key: ${encryptedPrivateKey}`))
            break;
        }
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
            break
        case "createProjectAndUser":
            withDBConfirmation(async()=>{
                const projectId = await input({ message: 'Enter your projectID' });
                const projectName = await input({ message: 'Enter your project name' });
                const userEmail = await input({ message: 'Enter your user email' });
                const industry = await input({ message: 'Enter your industry' });
                const expectedMonthlyVolume = await input({ message: 'Enter expected monthly volume' });
                const url = await input({ message: 'Enter business URL (optional)', required: false });
                const payoutAddress = await input({ message: 'Enter payout address', required: true });

                // Create project
                await db.insert(projects).values({
                    projectId,
                    name: projectName,
                    industry,
                    expectedMonthlyVolume: Number(expectedMonthlyVolume),
                    url: url || undefined,
                    fiatActive: true,
                    fiatOptions: ['0'],
                    feePercentage: 1,
                    settlementType: 'payout',
                    rollingReservePercentage: 0,

                });
                const key = generateAPIKey()

                await db.insert(apiKeys).values({
                    apiKey:key,
                    projectId:projectId,
                    planId:"qwuvlj0ucqqr3"
                })

                // Create user
                await db.insert(users).values({
                    email: userEmail,
                    projectId,
                    onBoardStage: 'kyc-completed'
                });

                // Create project settings
                await db.insert(projectSettings).values({
                    projectId,
                    showFeesInCheckout: false
                });

                // Create payout settings
                await db.insert(payoutSettings).values({
                    projectId,
                    payoutPeriod: 'instant',
                    blockchain: 'arbitrum-one',
                    chainId: 42161,
                    isActive: true,
                    settlementType: 'payout',
                    payoutAddress:payoutAddress
                });

                // Create payout balance
                await db.insert(payoutBalance).values({
                    projectId
                });

                console.log(chalk.greenBright("Project and user created successfully"));
            })
            break
        case "linkUserToProject":
            withDBConfirmation(async()=>{
                const projectId = await input({ message: 'Enter your projectID' });
                const userEmail = await input({ message: 'Enter your user email' });
                const userName = await input({ message: 'Enter your user name' });
                await db.insert(users).values({
                    email:userEmail,
                    projectId:projectId,
                    onBoardStage:"kyc-completed",
                    name:userName
                })

            })
            break
        case "createPaymentProcessors":
            withDBConfirmation(async()=>{
                const paymentProcessorId = await input({ message: 'Select which payment processor id'});
                const name = await input({ message: 'Enter the name of the payment processor'});
                const averageFeePercentage = await input({ message: 'Enter the average fee percentage',required:false});
                const averageFixedFee = await input({ message: 'Enter the average fixed fee',required:false});
                const final = paymentProcessorInsertSchema.parse({
                    paymentProcessorId:paymentProcessorId,
                    description:name,
                    averageFeePercentage:Number(averageFeePercentage),
                    averageFixedFee:Number(averageFixedFee)
                })
                await db.insert(paymentProcessors).values(final)
            })
        break;
        case "insertLiquidityPayoutSettings":
            withDBConfirmation(async()=>{
                const csvFilePath = await input({ message: 'Enter the path to your CSV file' });
                const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
                const records = parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true
                });

                const insertCalls = records.map((record: any) => {
                    return db.insert(liquidityAndPayoutAddressesSettings).values({
                        id: record.id,
                        payoutAddress: record.payoutAddress,
                        liquidityProviderId: record.liquidityProviderId,
                        totalVolumeInFiat: parseFloat(record.totalVolume) || 0,
                        active: record.active === 'true',
                        createdAt: new Date(record.createdAt)
                    });
                });

                console.log(`Inserting ${insertCalls.length} records...`);
                await db.batch(insertCalls as any);
                console.log(chalk.greenBright("Successfully inserted liquidity payout settings"));
            })
            break;
    }
    
    console.log(chalk.greenBright("DB ACTIONS ENDED"))
    
}
dbActions()