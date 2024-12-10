export * as Schema from "./index";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { id } from "ethers";
import { nanoid } from "nanoid";
import {
  createInsertSchema,
  createSelectSchema,
} from "../../util/drizzle-to-zod";
import { relations } from "drizzle-orm";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
extendZodWithOpenApi(z);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "confirmed-onchain",
  "failed",
  "cancelled",
  "refunded",
  "fiat-confirmed",
  "confirmed",
]);

export const settlementTypeEnum = pgEnum("settlement_type", [
  "payout",
  "smart-contract",
])
export const tokenTypeEnum = pgEnum("donationTokenTypeEnum", ["TOKEN", "NFT"]);
export const paymentUsers = pgTable("project_payment_users", {
  id: varchar("id")
    .$default(() => nanoid(10))
    .primaryKey(),

  email: text("email"),
  name: text("name"),
  paypalId: text("paypalId"),
  externalId: text("externalId"),
  projectId: text("projectId"),
  phoneNumber: text("phoneNumber"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

export const paymentUsersAndTransactions = relations(
  paymentUsers,
  ({ many }) => ({
    transactions: many(transactions),
  })
);

export const paymentLinks = pgTable("payment_links", {
  id: varchar("id").primaryKey().$default(() => nanoid(10)),
  projectId: text("projectId").references(() => projects.projectId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  link: text("link").notNull(),

})
export const transactions = pgTable("transactions", {
  id: varchar("id")
    .$default(() => nanoid(20))
    .primaryKey(),
  projectId: text("projectId"),
  paymentId: text("paymentId"),
  externalPaymentProviderId: text("externalPaymentProviderId"),
  chainId: integer("chainId").default(10),
  blockChainName: text("blockChainName").default("evm"),

  blockchainTransactionId: text("blockchainTransactionId"),
  paymentUserId: varchar("paymentUserId").references(() => paymentUsers.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  amountInFiat: real("amountInFiat"),
  currencyInFiat: varchar("currencyInFiat"),
  finalAmountInFiat: real("finalAmountInFiat").default(0),
  paymentProcessFeesInFiat: real("paymentProcessFeesInFiat").default(0),
  platformFeesInFiat: real("platformFeesInFiat").default(0),
  token: varchar("token").notNull().default("USDC"),
  amountInToken: real("amountInToken").notNull().default(0),
  decimals: integer("decimals").notNull().default(6),
  tokenType: tokenTypeEnum("tokenType").default("TOKEN"),
  paymentIntent: text("paymentIntent"),
  metadataJson: json("metadataJson").default({}),
  extraMetadataJson: json("extraMetadata").default({}),
  status: transactionStatusEnum("status").default("pending"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

export const transactionsAndPaymentUser = relations(
  transactions,
  ({ one }) => ({
    paymentUser: one(paymentUsers, {
      fields: [transactions.paymentUserId],
      references: [paymentUsers.id],
    }),
  })
);

export const wallets = pgTable("wallets", {
  id: varchar("id")
    .$default(() => nanoid(10))
    .primaryKey(),
  address: text("address").notNull(),
  blockchain: text("blockchain").notNull(),
  projectId: text("projectId").notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
  key: text("key"),
});

// Define the API Plans table
export const apiPlans = pgTable("api_plans", {
  id: varchar("id")
    .$default(() => nanoid(10))
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rateLimit: integer("rateLimit").notNull(), // Define rate limit or other plan-specific details
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

// Define the API Keys table
export const apiKeys = pgTable("api_keys", {
  id: varchar("id")
    .$default(() => nanoid(20))
    .primaryKey(),
  projectId: text("projectId").notNull(), // Reference to the project
  apiKey: varchar("apiKey").notNull().unique(), // Unique API key
  secretKey: varchar("secretKey").unique(), // Secret key for signing requests

  planId: varchar("planId").references(() => apiPlans.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }), // Reference to API Plans table
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

export const apiKeyAndApiPlan = relations(apiKeys, ({ one }) => ({
  apiPlan: one(apiPlans, {
    fields: [apiKeys.planId],
    references: [apiPlans.id],
  }),
}));

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => nanoid(14)),
  projectId: text('projectId').unique().notNull(),
  name: text('name').notNull(),
  url: text('url'),
  fiatActive: boolean('fiat_active').default(true),
  fiatOptions: json('fiat_options').$type<string[]>().default(['0']),
  feePercentage: real('fee_percentage').default(2.5).notNull(),
  payoutAddressOnEvm: text('payout_address_on_evm'),
  settlementType: settlementTypeEnum('settlement_type').default('payout'),
  feeAmount: real('fee_amount'), // optional
  referral: text('referral'), // optional
});
export const projectsRelations = relations(projects, ({ one }) => ({
  referralProject: one(projects, {
    fields: [projects.referral],
    references: [projects.projectId],
  })
}))
export const projectsSelectSchema = createSelectSchema(projects);
/// AUTH SCHEMA +=========================
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  projectId: text("projectId").references(() => projects.projectId,{
    onDelete: "cascade",
    onUpdate: "cascade",
  })
})


 
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)
 
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)
 
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)
/// AUTH SCHEMA +=========================


// Define Zod schemas for inserts and selects
export const apiPlansInsertSchema = createInsertSchema(apiPlans);
export const apiPlansSelectSchema = createSelectSchema(apiPlans);
export const apiKeysInsertSchema = createInsertSchema(apiKeys);
export const apiKeysSelectSchema = createSelectSchema(apiKeys);

// Define a combined schema for API key with its associated plan
export const apiKeySelectSchemaWithPlan = apiKeysSelectSchema
  .extend({
    apiPlan: apiPlansSelectSchema.nullable(),
  })
  .openapi("ApiKeyWithPlan");

export const transactionsInsertSchema = createInsertSchema(transactions);
export const transactionsSelectSchema = createSelectSchema(transactions);
export const paymentUsersSelectSchema = createSelectSchema(paymentUsers);

export const transactionSelectSchemaWithPaymentUser = transactionsSelectSchema
  .extend({
    paymentUser: paymentUsersSelectSchema.nullable(),
  })
  .openapi("TransactionWithPaymentUser");
