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
import { createSolanaTransaction, createTransaction,  routeTransaction} from "@normietech/core/wallet/index";
import {PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import { Debridge } from "@normietech/core/debrige/index";
import { USD_TOKEN_ADDRESSES } from "@normietech/core/wallet/types";
import { parseEther, parseUnits } from "viem";
import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { sleep } from "@normietech/core/util/sleep";

const app = new OpenAPIHono()
  .use("*",cors())
  .get("/ping", async (c) => {
    return c.json("pong");
  })
  .get("/quoteSolana", async (c) => {
    const newTransaction = new Transaction();
    newTransaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey("GimnqBubADRU26ZhbArfVNBBGDfJSBLQSav7WgR1MDqB"),
        toPubkey: new PublicKey("GimnqBubADRU26ZhbArfVNBBGDfJSBLQSav7WgR1MDqB"),
        lamports: 100000,
      })
    )
    const decimals = await getDecimalsOfToken("solana",USD_TOKEN_ADDRESSES['solana'])
    await sleep(4000)
    const response = await routeTransaction({
      blockchainName:"solana",
      chainId:0,
      type:"solana_reserve",
      transactionData:[
        newTransaction
      ],
      settlementToken:{
        address:USD_TOKEN_ADDRESSES['solana'],
        decimals:decimals,
        amount:parseUnits("2",decimals)
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

 

  

app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);