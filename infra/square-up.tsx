// import * as pulumi from "@pulumi/pulumi";
// import * as crypto from "crypto";
// import "dotenv/config"
// import { Client ,Environment} from "square";
// export interface SquareWebhookArgs {
//     name:string,
//     notificationUrl:string,


// }
// class SquareWebhookProvider implements pulumi.dynamic.ResourceProvider{
//     private accessToken : string  = ""
//     private client : Client;
//     async configure(req: pulumi.dynamic.ConfigureRequest): Promise<void> {
//         this.accessToken = process.env.SQUARE_API_KEY || ""
//         this.client = new Client({
//             environment:Environment.Sandbox,
//             bearerAuthCredentials:{
//                 accessToken:this.accessToken
//             }
//         })
//     }
//     async create(inputs) {
//         const idempotencyKey = crypto.randomBytes(16).toString('hex');
//         const webhook = await this.client.webhookSubscriptionsApi.createWebhookSubscription({
//             subscription:{
//                 eventTypes:[""],
//                 notificationUrl,
                

//             },
//             idempotencyKey : idempotencyKey
//         })
//         return { id: crypto.randomBytes(16).toString('hex'), outs: {}};
//     }
  

// }


// export class SquareWebhook extends pulumi.dynamic.Resource {
//     constructor(name: string, opts?: pulumi.CustomResourceOptions) {
//         super(squareUp, name, {}, opts);
//     }   
// }





// export const squareUp =  {
//     SquareWebhook,
// }
