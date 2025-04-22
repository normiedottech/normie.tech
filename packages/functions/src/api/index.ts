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
  .post(
    "/v1/squid",
    async (c) => {
      const body = await c.req.json();
      console.log(body);

      const toAddress = body.toAddress;
      const amount = body.amount;

      console.log(body.toAddress)

      try {
        const originData = await getOriginData("reserve");

        console.log("origin data is fine")

        const originDecimals = originData.originDecimals;
        const originToken = originData.originToken;
        const originChainId = originData.originChainId;
        const originBlockchain = originData.originBlockchain;
        const originClient = originData.originClient;
        const originBalance = originData.originBalance;

        console.log("origin client is fine")

        console.log(originBalance, "origin balance")
        console.log(originBlockchain, "origin blockchain")
        console.log(originChainId, "origin chain id")
        console.log(originDecimals, "origin decimals")
        console.log(originToken, "origin token")
        

        // const amountInUnits = parseUnits(amount, originDecimals);

        
        

        // Celo origin client for destination balance
        const celoClient = createPublicClient({
          transport: http(getRPC(42220)), // Celo mainnet RPC
        });

        console.log("celo client is fine")
        const decimals = await getDecimalsOfToken("celo", USD_TOKEN_ADDRESSES["celo"], 42220);

        console.log("decimals if fine here")
        // Fetch Celo balance of the destination token
        const celoBalance = await celoClient.readContract({
          abi: erc20Abi,
          address: USD_TOKEN_ADDRESSES["celo"] as `0x${string}`, // Celo USDC as destination token
          functionName: "balanceOf",
          args: [getAddress("reserve") as `0x${string}`], // Use reserve address on Celo
        });

        console.log("celo balance is fine")

        console.log(celoBalance);
        console.log(amount);

        const response = await createSquidTransaction(
          {
            toAddress,
            toToken: USD_TOKEN_ADDRESSES["celo"], // Celo USDC as target
          },
          {
            balanceOfDestinationToken: celoBalance, // Replaced with actual Celo balance
            destinationBlockchain: "celo",
            settlementToken: {
              address: USD_TOKEN_ADDRESSES["celo"],
              decimals: decimals,
              amount: body.amount,
            },
          },
          {
            originBalance,
            originBlockchain,
            originChainId,
            originClient,
            originDecimals,
            originToken
          }
        );
        console.log("response", response);

        return c.json({
          status: "success",
          amount,
          message: "Squid transaction initiated",
        });
      } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
      }
    }
  )
  .post("/v1/squid-route", async(c) => {

    const body = await c.req.json();
    const type = "reserve";
    const {blockchanName, chainId, settlementToken, transactionData} = body;

  });
app.route("/v1",v1App)
showRoutes(app, {
  verbose: true,
  colorize:true,
})
export const handler = handle(app);