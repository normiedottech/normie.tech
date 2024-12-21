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
import {Payout} from "@normietech/core/payout";
import { getProjectById } from "@normietech/core/config/project-registry/utils";
extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
PROJECT_REGISTRY_DOCS_API["default"].forEach(route => registry.registerPath(route));

const projectIdApp = new Hono()
 .get("/open-api",async (c) => {
    const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
    PROJECT_REGISTRY_DOCS_API[projectId as keyof typeof PROJECT_REGISTRY_DOCS_API].forEach(route => registry.registerPath(route));
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
    const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage);
    const url = new URL(`${domain}/v1/${projectId}/open-api`).toString()
    return c.html(getDocumentationHTML(url));
 })
 .post("/payout", apiKeyMiddleware, async (c) => {
    const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
    const project = await getProjectById(projectId);
    if (!project.fiatActive) {
        return c.json({
            error: "Fiat payouts are not enabled for this project",
        },500);
    }
    const payout = new Payout(projectId)
    const hash = await payout.triggerOnChainPayout();
    return c.json({
        hash,
    })
 })
 .get("/info", async (c) => {
  const projectId = await parseProjectRegistryKey(c.req.param("projectId"));
  const project =
    PROJECT_REGISTRY[projectId as keyof typeof PROJECT_REGISTRY];
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
