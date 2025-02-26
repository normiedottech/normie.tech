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
import { createSolanaTransaction, createTransaction, replenishWallets, routeTransaction} from "@normietech/core/wallet/index";
import {PublicKey} from "@solana/web3.js";
import { Debridge } from "@normietech/core/debrige/index";
import { USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { parseEther, parseUnits } from "viem";

const app = new OpenAPIHono()
  .use("*",cors())
  .get("/ping", async (c) => {
    return c.json("pong");
  })
  .get("/quote", async (c) => {
    const debridge = new Debridge();
    const response = await routeTransaction({
      blockchainName:"optimism",
      chainId:10,
      type:"reserve",
      transactionData:[
        {
          to:"0xF7D1D901d15BBf60a8e896fbA7BBD4AB4C1021b3",
          value:parseEther("0.0001"),
          data:"0x",
        }
      ],
      settlementToken:{
        address:USD_TOKEN_ADDRESSES['optimism'],
        decimals:6,
        amount:parseUnits("1",6),
      }
    })
    return c.json({response});
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
    console.log(url);
    return c.html(getDocumentationHTML(url));
  })

  .post("/replenish", async (c) => {
    const {srcChainId, dstChainId, amount, srcTokenAddress, dstTokenAddress} = await c.req.json();
    try {
      const response = await replenishWallets(srcChainId, dstChainId, amount, srcTokenAddress, dstTokenAddress);
      console.log(response);
      return c.json({response});
    } catch (error: any) {
      return c.json({error: error.message}, 400);
    }
  })

  .post('/create-evm-transaction', async (c) => {
    
    const { transactionDatas, type, chainId, blockchain} = await c.req.json();
    try {
      const response = await createTransaction(transactionDatas, type, chainId, blockchain);
      console.log(response);
      return c.json({response});
    } catch (error: any) {
      return c.json({error: error.message}, 400);
    }
  })

  .post('/create-solana-transaction', async (c) => {
    console.log("create-solana-transaction...........");
    try {
      const { transactionDatas, type } = await c.req.json();
      
      // console.log("type", type);
      const response = await createSolanaTransaction(transactionDatas, type);
      return c.json({ response });
    } catch (error: any) {
      console.log("error", error);
      return c.json({ 
        error: "Invalid JSON format. Remove hidden characters.",
        details: error.message 
      }, 400);
    }
  })

app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);