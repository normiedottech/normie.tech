export * as Schema from "./index"
import { integer, json, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { id } from "ethers";
import { nanoid } from "nanoid";
import { createInsertSchema, createSelectSchema } from '@/util/drizzle-to-zod';
import { relations } from "drizzle-orm";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
extendZodWithOpenApi(z)
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "confirmed-onchain", "failed", "cancelled","refunded","confirmed"]);
export const tokenTypeEnum = pgEnum('donationTokenTypeEnum', [
    'TOKEN',
    'NFT',
])
export const paymentUsers = pgTable("users",{
    id: varchar('id')
    .$default(() => nanoid(10))
    .primaryKey(),
    
    email: text('email'),
    name: text('name'),
    paypalId: text('paypalId'),
    externalId: text('externalId'),
    projectId: text('projectId'),
    phoneNumber: text('phoneNumber'),
    createdAt: timestamp('createdAt', {
        mode: 'date',
        withTimezone: true,
      }).$default(() => new Date()),
      updatedAt: timestamp('updatedAt', {
        mode: 'date',
        withTimezone: true,
      }).$onUpdate(() => new Date()),
})

export const paymentUsersAndTransactions = relations(paymentUsers,({many})=>({
    transactions: many(transactions),
}))

export const transactions = pgTable("transactions", {
  id: varchar('id')
  .$default(() => nanoid(20))
  .primaryKey(),
  projectId: text('projectId'),
  paymentId: text('paymentId'),
  externalPaymentProviderId: text('externalPaymentProviderId'),
  chainId: integer('chainId').default(10),
  blockChainName: text('blockChainName').default('evm'),
  
  blockchainTransactionId: text('blockchainTransactionId'),
  paymentUserId: varchar('paymentUserId').references(() => paymentUsers.id,{
    onDelete:'set null',
    onUpdate:'cascade'
  }),
  amountInFiat: real('amountInFiat'),
  currencyInFiat: varchar('currencyInFiat'),
  token: varchar('token').notNull().default('USDC'),
  amountInToken: real('amountInToken').notNull().default(0),
  decimals: integer('decimals').notNull().default(6),
  tokenType: tokenTypeEnum('tokenType').default('TOKEN'),
  paymentIntent: text('paymentIntent'),
  metadataJson: json('metadataJson').default({}),
  extraMetadataJson: json('extraMetadata').default({}),
  status:transactionStatusEnum('status').default("pending"),
})

export const transactionsAndPaymentUser = relations(transactions,({one})=>({
  paymentUser: one(paymentUsers,{
    fields:[transactions.paymentUserId],
    references:[paymentUsers.id]
  }),

}))


export const wallets = pgTable("wallets", {
  id: varchar('id')
  .$default(() => nanoid(10))
  .primaryKey(),
  address: text('address').notNull(),
  blockchain: text('blockchain').notNull(),
  projectId: text('projectId').notNull(),
  createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
  }).$onUpdate(() => new Date()),
  key: text('key'),
})

// Define the API Plans table
export const apiPlans = pgTable("api_plans", {
  id: varchar('id')
      .$default(() => nanoid(10))
      .primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  rateLimit: integer('rateLimit').notNull(), // Define rate limit or other plan-specific details
  createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
  }).$onUpdate(() => new Date()),
});

// Define the API Keys table
export const apiKeys = pgTable("api_keys", {
  id: varchar('id')
      .$default(() => nanoid(20))
      .primaryKey(),
  projectId: text('projectId').notNull(), // Reference to the project
  apiKey: varchar('apiKey').notNull().unique(), // Unique API key
  secretKey: varchar('secretKey').unique(), // Secret key for signing requests
  
  planId: varchar('planId').references(() => apiPlans.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade'
  }), // Reference to API Plans table
  createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
  }).$onUpdate(() => new Date()),
});



export const apiKeyAndApiPlan = relations(apiKeys, ({ one }) => ({
  apiPlan: one(apiPlans, {
      fields: [apiKeys.planId],
      references: [apiPlans.id]
  })
}));

// Define Zod schemas for inserts and selects
export const apiPlansInsertSchema = createInsertSchema(apiPlans);
export const apiPlansSelectSchema = createSelectSchema(apiPlans);
export const apiKeysInsertSchema = createInsertSchema(apiKeys);
export const apiKeysSelectSchema = createSelectSchema(apiKeys);

// Define a combined schema for API key with its associated plan
export const apiKeySelectSchemaWithPlan = apiKeysSelectSchema.extend({
  apiPlan: apiPlansSelectSchema.nullable(),
}).openapi("ApiKeyWithPlan");


export const transactionsInsertSchema = createInsertSchema(transactions)
export const transactionsSelectSchema = createSelectSchema(transactions)
export const paymentUsersSelectSchema = createSelectSchema(paymentUsers)

export const transactionSelectSchemaWithPaymentUser = transactionsSelectSchema.extend({
  paymentUser:paymentUsersSelectSchema.nullable(),
  metadata:z.any()
}).openapi("TransactionWithPaymentUser")