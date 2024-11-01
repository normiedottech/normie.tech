import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { PROJECT_REGISTRY, projectSchema } from ".";
import { z } from "zod";
const commonDocs : RouteConfig[] = [
    {
        method: 'get',
        path:'/v1/{projectId}/info',
        description: 'Returns the current info of the project',

        responses:{
            200:{
                description: 'Returns the current info of the project',
                content:{
                    "application/json":{
                        schema:projectSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    }
]
const voiceDeckDocs : RouteConfig[] = [
    {
        method: 'post',
        path:'/v1/voice-deck/0/checkout',
        description: 'Create a checkout session for stripe in the voice deck project',
        request:{
            body:{
                required:true,
                description:'The request body of voice deck stripe checkout',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].bodySchema
                    }
                }
            },
            headers:z.object({
                "x-api-key":z.string()
            })
        },
        responses:{
            200:{
                description: 'Returns the checkout session',
                content:{
                    "application/json":{
                        schema:PROJECT_REGISTRY["voice-deck"].routes.checkout["0"].responseSchema
                    }
                }
            },
            500:{
                description: 'Internal Server Error'
            }
        }
    }
]
export const PROJECT_REGISTRY_DOCS_API = {
    "default":commonDocs,
    "voice-deck":voiceDeckDocs

    
}