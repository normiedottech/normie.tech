import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { getDocumentationHTML } from "@/utils";



export const get: APIGatewayProxyHandlerV2 = async (_event,ctx) => {
    const url = new URL(`https://${_event.requestContext.domainName}/${Resource.App.stage}/open-api`).toString()
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
