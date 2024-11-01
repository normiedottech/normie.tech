import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { getDocumentationHTML } from "@/utils";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";



export const get: APIGatewayProxyHandlerV2 = async (_event,ctx) => {
    if(!_event.pathParameters){
        throw new Error("Missing path parameters")
    }
    const projectId = parseProjectRegistryKey(_event?.pathParameters.projectId);
    const url = new URL(`https://${_event.requestContext.domainName}/${Resource.App.stage}/v1/${projectId}/open-api`).toString()
    console.log(url)
    const html = getDocumentationHTML(url);
    return {
        statusCode: 200,
        body:html,
        headers:{
            "Content-Type":"text/html"
        }
    };
}
