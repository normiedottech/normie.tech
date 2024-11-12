import { getDocumentationHTML, parseValidDomain } from "@/utils";
import {  z } from "@hono/zod-openapi";
import { API_VERSION, } from "@normietech/core/config/index";
import { Hono } from "hono";
import { Resource } from "sst";
import {
  parseProjectRegistryKey,
  PROJECT_REGISTRY,
} from "@normietech/core/config/project-registry/index";
import { PROJECT_REGISTRY_DOCS_API } from "@normietech/core/config/project-registry/docs";
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import transactionProjectApp from "./transactions";
import paymentProjectApp from "./[paymentId]";
import { apiKeyMiddleware } from "@/middleware/apiKey";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
PROJECT_REGISTRY_DOCS_API["default"].forEach(route => registry.registerPath(route));

const projectIdApp = new Hono()
 .get("/open-api",async (c) => {
    const projectId = parseProjectRegistryKey(c.req.param("projectId"));
    PROJECT_REGISTRY_DOCS_API[projectId].forEach(route => registry.registerPath(route));
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const openApiJson = generator.generateDocument({
        info:{
            title: `Normie Tech API V1 for project id: ${projectId}`,
            version: API_VERSION,
        },
        openapi:"3.0.0",
    })
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage); 
    openApiJson.servers = [
    {
        url: new URL(domain).toString()
    }
    ]
    return c.json(openApiJson)
 })
 .get("/docs", async (c) => {
    const projectId = parseProjectRegistryKey(c.req.param("projectId"));
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage);
    const url = new URL(`${domain}/v1/${projectId}/open-api`).toString()
    return c.html(getDocumentationHTML(url));
 })
 .use("/info",apiKeyMiddleware)
 .get("/info", async (c) => {
  const project =
    PROJECT_REGISTRY[parseProjectRegistryKey(c.req.param("projectId"))];
  return c.json({
    fiatActive: project.fiatActive,
    name: project.name,
    id: project.id,
    url: project.url,
  });
});
projectIdApp.route("/:paymentId", paymentProjectApp);
projectIdApp.route("/transactions", transactionProjectApp);
export default projectIdApp
