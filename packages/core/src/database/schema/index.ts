export * as Schema from "./index";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
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

/// AUTH SCHEMA +=========================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});
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
