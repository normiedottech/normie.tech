import { getDocumentationHTML, parseValidDomain } from "@/utils";
import { OpenAPIHono } from "@hono/zod-openapi";
import { API_VERSION, SDK_VERSION } from "@normietech/core/config/index";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { openApiJson } from "./open-api";
import v1App from "./v1";
import { cors } from 'hono/cors'
import { showRoutes } from "hono/dev";

import { generatePrivateKey } from "viem/accounts";


const app = new OpenAPIHono()
  .get("/ping", async (c) => {
    return c.json("pong");
  })
  .get("/version", async (c) => {
    const privateKey =  generatePrivateKey()
    return c.json({
      apiVersion: API_VERSION,
      sdkVersion: SDK_VERSION,
      privateKey
    });
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
 
  .get("/docs", async (c) => {
    const domain = parseValidDomain(
      new URL(c.req.url).hostname,
      Resource.App.stage
    );
    const url = new URL(`${domain}/open-api`).toString();
    console.log(url);
    return c.html(getDocumentationHTML(url));
  });

app.use(cors())
app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,

})
export const handler = handle(app);
