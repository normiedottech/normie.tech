import { db } from "@normietech/core/database/index"
import {  isNotNull } from "drizzle-orm"
import chalk from "chalk"
import { payoutSettings, projects } from "@normietech/core/database/schema/index"

async function migrationScripts() {

    console.log(chalk.greenBright("Running Migration Scripts"))
    const arbPayoutAddresses = await db.query.projects.findMany({
        where:isNotNull(projects.payoutAddressOnEvm),
        columns:{
            payoutAddressOnEvm:true,
            projectId:true
        }
    })
    const createPayoutTransactons = await db.transaction(async (tx) => {
        // for (const project of arbPayoutAddresses) {
        //     const payout = await tx.insert(payoutSettings).values({
        //         payoutPeriod:"instant",
        //         blockchain:"arbitrum-one",
        //         chainId:42161,
        //         projectId:project.projectId,
        //         payoutAddress:project.payoutAddressOnEvm
        //     })
        //     console.log(payout)
        // }
        // await tx.update(projects).set({
        //     payoutAddressOnEvm:null
        // })
    }) 
    console.log(arbPayoutAddresses)
}
migrationScripts()