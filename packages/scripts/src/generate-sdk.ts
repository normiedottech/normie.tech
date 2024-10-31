import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import {parseProjectRegistryKey} from "@normietech/core/project-registry/index"
async function generateSdk() {
    console.log(chalk.greenBright("Generating SDK clients for normie tech api"))
    const apiUrl = await input({ message: chalk.blueBright("Enter the api url"),default:"https://api.normie.tech" });
    const projectId = parseProjectRegistryKey(await input({ message: chalk.blueBright("Enter the project id") }));
    
}
generateSdk()