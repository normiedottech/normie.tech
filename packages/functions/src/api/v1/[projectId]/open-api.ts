import { Resource } from "sst";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { extendZodWithOpenApi,OpenApiGeneratorV3,OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { API_VERSION } from "@normietech/core/config/index";
import { parseValidDomain, withHandler } from "@/utils";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { PROJECT_REGISTRY_DOCS_API } from "@normietech/core/config/project-registry/docs";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
PROJECT_REGISTRY_DOCS_API["default"].forEach(route => registry.registerPath(route));


export const get: APIGatewayProxyHandlerV2  = withHandler(async (_event,ctx) => {
    if(!_event.pathParameters){
        throw new Error("Missing path parameters")
    }
    const projectId = parseProjectRegistryKey(_event?.pathParameters.projectId);
    PROJECT_REGISTRY_DOCS_API[projectId].forEach(route => registry.registerPath(route));
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const openApiJson = generator.generateDocument({
        info:{
            title: `Normie Tech API V1 for project id: ${projectId}`,
            version: API_VERSION,
        },
        openapi:"3.0.0",
    })
    const domain = parseValidDomain(_event.requestContext.domainName,Resource.App.stage); 
    openApiJson.servers = [
    {
        url: new URL(domain).toString()
    }
    ]
  return {
    statusCode: 200,
    body: JSON.stringify(openApiJson),
  };
});
