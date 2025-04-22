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
import { createSolanaTransaction, createSquidTransaction, createTransaction,  getAddress,  getOriginData,  getRPC,  routeTransaction} from "@normietech/core/wallet/index";
import {PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import { Debridge } from "@normietech/core/debrige/index";
import { USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { parseEther, parseUnits, encodeFunctionData, erc20Abi, createPublicClient, http } from "viem";
import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { sleep } from "@normietech/core/util/sleep";
import { L } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

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
    return c.html(getDocumentationHTML(url));
  })
  
app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);