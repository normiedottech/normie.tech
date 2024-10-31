import { Resource } from "sst";
import { APIGatewayProxyHandlerV2, Handler } from "aws-lambda";
import { extendZodWithOpenApi,OpenApiGeneratorV3,OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { doc  as pingDoc } from "./ping";
import {doc as versionDoc} from "./version";
import { API_VERSION } from "@normietech/core/constants";
import { withHandler } from "@/utils";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

[pingDoc,versionDoc].forEach(route => registry.registerPath(route));

const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiJson = generator.generateDocument({
    info:{
        title: "Normie Tech API V1",
        version: API_VERSION,
    },
    openapi:"3.0.0",
    
})
export const get: APIGatewayProxyHandlerV2  = withHandler(async (_event,ctx) => {
  
  openApiJson.servers = [
    {
        url: new URL(`https://${_event.requestContext.domainName}/${Resource.App.stage}`).toString()
    }
  ]
  return {
    statusCode: 200,
    body: JSON.stringify(openApiJson),
  };
});
