import { getDocumentationHTML, parseValidDomain } from "@/utils";
import { OpenAPIHono } from "@hono/zod-openapi";
import { API_VERSION, SDK_VERSION } from "@normietech/core/config/index";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { openApiJson, zelleOpenApiJson } from "./open-api";
import v1App from "./v1";
import { cors } from 'hono/cors'
import { showRoutes } from "hono/dev";

const app = new OpenAPIHono()
  .use("*",cors())
  .get("/ping", async (c) => {
    return c.json("pong");
  }) 
  .get("/version", async (c) => {
    
    return c.json({
      apiVersion: API_VERSION,
      sdkVersion: "3k",
    
    });
  })
  .post("/test",async (c) => {
    const body = await c.req.json()
    const headers = c.req.header()
    console.log({body})
    console.log({headers})
    
    return c.json({
      message: "Hello World"
    })
  })
  .get("/open-api",async (c) => {
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage);
    openApiJson.servers = [
      {
          url: new URL(domain).toString()
      }
    ]
    return c.json(openApiJson)
  })
  .get("/zelle/open-api",async (c) => {
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage);
    zelleOpenApiJson.servers =[ 
      {
          url: new URL(domain).toString()
      }
    ]
    return c.json(zelleOpenApiJson)
  })
  .get("/zelle/docs",async (c) => {
    const domain = parseValidDomain(new URL(c.req.url).hostname,Resource.App.stage);
    const url = new URL(`${domain}/zelle/open-api`).toString(); 
    return c.html(getDocumentationHTML(url));
  })
 
  .get("/docs", async (c) => {
    const domain = parseValidDomain(
      new URL(c.req.url).hostname,
      Resource.App.stage
    );
    const url = new URL(`${domain}/open-api`).toString(); 
    return c.html(getDocumentationHTML(url));
  })
  
app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);