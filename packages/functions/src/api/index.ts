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
import { parseEther, parseUnits, encodeFunctionData, erc20Abi } from "viem";
import { getDecimalsOfToken } from "@normietech/core/blockchain-client/index";
import { sleep } from "@normietech/core/util/sleep";

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
  .post(
    "/v1/test-route-transaction",
    async (c) => {
      const body = await c.req.json();

      const { toAddress, tokenAddress, amount, blockchainName, chainId } = body.data;

      try {
        const decimals = await getDecimalsOfToken(tokenAddress, blockchainName, chainId);
        const amountInUnits = parseUnits(amount, decimals);
        const txData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [toAddress, amountInUnits],
        });

        const txHash = await routeTransaction({
          type: "reserve",
          blockchainName,
          chainId,
          transactionData: [
            {
              data: txData,
              to: tokenAddress,
              value: "0",
            },
          ],
          settlementToken: {
            address: tokenAddress,
            decimals,
            amount: amountInUnits,
          },
        });

        return c.json({
          status: "success",
          transactionHash: txHash,
          blockchainName,
          tokenAddress,
          amount,
        });
      } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
      }
    }
  );
app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);