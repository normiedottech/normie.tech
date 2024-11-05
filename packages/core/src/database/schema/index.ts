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
  .$default(() => nanoid(10))
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
  metadataJson: json('metadataJson').default({}),
  status:transactionStatusEnum('status').default("pending"),
})

export const transactionsAndPaymentUser = relations(transactions,({one})=>({
  paymentUser: one(paymentUsers),

}))

export const transactionsInsertSchema = createInsertSchema(transactions)
export const transactionsSelectSchema = createSelectSchema(transactions)
export const paymentUsersSelectSchema = createSelectSchema(paymentUsers)

export const transactionSelectSchemaWithPaymentUser = transactionsSelectSchema.extend({
  paymentUser:paymentUsersSelectSchema.nullable()
}).openapi("TransactionWithPaymentUser")