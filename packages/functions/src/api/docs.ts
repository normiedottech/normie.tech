import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { getDocumentationHTML, parseValidDomain } from "@/utils";



export const get: APIGatewayProxyHandlerV2 = async (_event,ctx) => {
    const domain = parseValidDomain(_event.requestContext.domainName,Resource.App.stage);
    const url = new URL(`${domain}/open-api`).toString()

    const html = getDocumentationHTML(url);
    return {
        statusCode: 200,
        body:html,
        headers:{
            "Content-Type":"text/html"
        }
    };
}
