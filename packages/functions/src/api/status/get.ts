
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import {  PROJECT_REGISTRY,ProjectRegistryKey  } from "@normietech/core/project-registry/index"
export const handler: APIGatewayProxyHandlerV2 = async (_event,ctx) => {
    const projectId = _event.pathParameters?.projectId
    if(!projectId){
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Missing projectId",
            }),
        };
    }
    const project = PROJECT_REGISTRY[projectId as ProjectRegistryKey];
    if(!project){
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "Project not found",
            }),
        };
    }

    return {
        
        statusCode: 200,
        body: JSON.stringify({
            fiatActive:project.fiatActive,
        }),
    };
}
