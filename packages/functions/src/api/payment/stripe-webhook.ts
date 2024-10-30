import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (_event,ctx) => {
    return {
        statusCode: 200,
        body: "pong",
    };
}