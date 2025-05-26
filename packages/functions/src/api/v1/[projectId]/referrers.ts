import { Hono } from 'hono';
import { z } from 'zod';
import { withHandler } from "@/utils";
import { db } from "@normietech/core/database/index";
import { apiKeys, payoutSettings, referrers } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
import { parseProjectRegistryKey } from "@normietech/core/config/project-registry/index";
import { nanoid } from 'nanoid';
import { createPublicClient, erc20Abi, http } from 'viem';
import { base, optimism } from "viem/chains";
import { createTransaction, getAddress, getRPC, sendTokenData } from '@normietech/core/wallet/index';
import { ChainId, USD_TOKEN_ADDRESSES } from '@normietech/core/wallet/types';

const referrersApp = new Hono();

// Schema for updating referrer
const updateReferrerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const claimReferrerSchema = z.object({
  address: z.string(),
  amount: z.number().min(0, "Amount must be greater than 0"),
});

// Schema for creating referrer
const createReferrerSchema = z.object({
  id: z.string().optional(), // Optional referral ID
  email: z.string().email().optional(),
  phone: z.string().optional(),
  percentageCut: z.number().min(0).max(5),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number must be provided",
  path: ["email", "phone"]
});

referrersApp.get('/', withHandler(async (c) => {
  const { projectId: projectIdParam } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const referrer = await db.query.referrers.findMany({
    where: eq(referrers.projectId, projectId),
  });
  return c.json(referrer, 200);
}));
referrersApp.get('/:referralId', withHandler(async (c) => {
  const { projectId: projectIdParam, referralId } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, referralId),
  });
  return c.json(referrer, 200);
}));
// Route for updating referrer details
referrersApp.put('/:referralId', withHandler(async (c) => {
  const { projectId: projectIdParam, referralId } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  if (!projectIdParam || !referralId) {
    return c.json({ error: "Missing path parameters" }, 400);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });
  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const body = await c.req.json();
  const updateData = updateReferrerSchema.parse(body);

  // Check if referrer exists and belongs to the project
  const existingReferrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, referralId),
  });

  if (!existingReferrer) {
    return c.json({ error: "Referrer not found" }, 404);
  }

  if (existingReferrer.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Update referrer
  const [updatedReferrer] = await db
    .update(referrers)
    .set({
      email: updateData.email ?? existingReferrer.email,
      phone: updateData.phone ?? existingReferrer.phone,
    })
    .where(eq(referrers.referralId, referralId))
    .returning();

  return c.json(updatedReferrer, 200);
}));

// Route for creating a new referrer
referrersApp.post('/', withHandler(async (c) => {
  const { projectId: projectIdParam } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');

  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const projectId = await parseProjectRegistryKey(projectIdParam);
  const projectIdFromApiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.apiKey, apiKey),
  });

  if (projectIdFromApiKey?.projectId !== projectId) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  const createData = createReferrerSchema.parse(body);

  // Use provided ID or generate a new one
  const referralId = createData.id || nanoid(10);

  // Create the referrer
  await db
    .insert(referrers)
    .values({
      referralId,
      projectId,
      email: createData.email,
      phone: createData.phone,
      percentageCut: createData.percentageCut,
    })
    .returning();
  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralId, referralId),
  });

  return c.json(referrer, 201);
}));



referrersApp.post('/:referralId/claim', withHandler(async (c) => {
  const { projectId, referralId } = c.req.param<any>();
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  const body = await c.req.json();
  const { address, amount } = claimReferrerSchema.parse(body);

  const [referrer, payoutSetting] = await db.batch([
    db.query.referrers.findFirst({
      where: eq(referrers.referralId, referralId),
    }),
    db.query.payoutSettings.findFirst({
      where: eq(payoutSettings.projectId, projectId),
    })
  ])

  if (!referrer) {
    return c.json({ error: "Referrer not found" }, 404);
  }

  if (!payoutSetting || !payoutSetting.chainId) {
    return c.json({ error: "Payout setting not found" }, 404);
  }

  const claimableAmount = referrer.amountEarned - referrer.amountClaimed;
  if (claimableAmount <= 0) {
    return c.json({ error: "No claimable amount" }, 400);
  }

  if (amount > claimableAmount) {
    return c.json({ error: "Claim amount exceeds claimable amount" }, 400);
  }

  const chainId = payoutSetting.chainId as ChainId;
  const blockChainName = payoutSetting.blockchain;
  const usdcAddress = USD_TOKEN_ADDRESSES[blockChainName] as `0x${string}`;


  const publicClient = createPublicClient({
    transport: http(getRPC(chainId)),
    chain: base,
  });

  const decimals = await publicClient.readContract({
    abi: erc20Abi,
    address: usdcAddress,
    functionName: "decimals",
  });

  const amountInToken = BigInt(Math.floor(amount * Math.pow(10, decimals)));

  console.log({ address, amountInToken });
  console.log({ usdcAddress });
  console.log(address);

  const balance = await publicClient.readContract({
    abi: erc20Abi,
    address: usdcAddress,
    functionName: "balanceOf",
    args: [getAddress('reserve') as `0x${string}`],
  });

  if (balance < amountInToken) {
    return c.json({ error: "Insufficient balance in reserve wallet" }, 500);
  }
  if(amount < 1) {
    return c.json({ error: "Minimum claim amount is 1" }, 500);
  }

  const txData = sendTokenData(address, Number(amountInToken));
  const transactionData = [{
    to: usdcAddress,
    value: "0",
    data: txData,
  }];
  const txHash = await createTransaction(transactionData, "reserve", chainId, "base");

  await db.update(referrers)
    .set({ amountClaimed: referrer.amountClaimed + amount })
    .where(eq(referrers.referralId, referralId));

  return c.json({ message: "Claim processed successfully", referralId, address, txHash }, 200);
}));

export default referrersApp; 