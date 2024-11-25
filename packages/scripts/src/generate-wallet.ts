import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { AESCipher } from "@normietech/core/util/encryption";
import { generatePrivateKey, } from "viem/accounts";
import {privateKeyToAccount} from "viem/accounts"
async function generateWallet() {
    console.log(chalk.greenBright("Generating Wallet for normie tech api with encrypted aes encryption"))
   
    const key = await input({ message: chalk.blueBright("Enter AES KEY") ,});
    const cipher = new AESCipher(key);
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    console.log(chalk.greenBright(`Address: ${account.address}`))
    
    console.log(chalk.greenBright(`Encrypted Private Key: ${cipher.encrypt(privateKey)}`))
}

generateWallet()