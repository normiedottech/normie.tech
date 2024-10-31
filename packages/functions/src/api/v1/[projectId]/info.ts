
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import {  PROJECT_REGISTRY,ProjectRegistryKey  } from "@normietech/core/project-registry/index"
import {parseProjectRegistryKey} from "@normietech/core/project-registry/index"
import {withHandler} from "@/utils"
export const get: APIGatewayProxyHandlerV2 = withHandler(async (_event,ctx) => {
    if(!_event.pathParameters){
        throw new Error("Missing path parameters")
    }
    const project = PROJECT_REGISTRY[parseProjectRegistryKey(_event.pathParameters.projectId)];
    return { 
        statusCode: 200,
        body: JSON.stringify({
            fiatActive:project.fiatActive,
            name:project.name,
            id:project.id,
            url:project.url,
        }),
    };
});
