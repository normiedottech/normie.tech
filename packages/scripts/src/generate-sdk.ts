import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import {parseProjectRegistryKey} from "@normietech/core/config/project-registry/index"
import { generateApi } from 'swagger-typescript-api';
import path from 'path';
import fs from "node:fs";
import openapiTS, { astToString } from 'openapi-typescript';
async function generateSdk() {
    console.log(chalk.greenBright("Generating SDK clients for normie tech api"))
    const apiUrl = await input({ message: chalk.blueBright("Enter the api url"),default:"https://api.normie.tech" });
    const projectId =await parseProjectRegistryKey(await input({ message: chalk.blueBright("Enter the project id") }));
    const openApiUrl = `${apiUrl.trim()}v1/${projectId}/open-api`
    console.log(chalk.greenBright(`Generating SDK clients for ${openApiUrl}`)) 
    const ast = await openapiTS(openApiUrl);
    const contents = astToString(ast);



    fs.writeFileSync( path.resolve(process.cwd(), `./src/sdk/${projectId}-normie-tech-client.ts`), contents);
    console.log(chalk.greenBright("Generated SDK clients for normie tech api"))
    
}
generateSdk()