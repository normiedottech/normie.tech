export * as Schema from "./index";
import {
  boolean,
  integer,
  json,
  PgEnum,
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
import { BLOCKCHAIN_VALUES } from "../../wallet/types";
extendZodWithOpenApi(z);
export const onBoardStageEnum = pgEnum("on_board_stage", [
  "no-project-created",
  "project-created",
  "payout-created",
  "kyc-completed"
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "confirmed-onchain",
  "failed",
  "cancelled",
  "refunded",
  "fiat-confirmed",
  "confirmed",
]);
export const blockchainTypesEnum = pgEnum("blockchain_types", [...BLOCKCHAIN_VALUES]);
export const settlementTypeEnum = pgEnum("settlement_type", [
  "payout",
  "smart-contract",
])

export const payoutPeriodTypeEnum = pgEnum("payout_period_type", [
  "custom",
  "instant",
  "daily",
  "weekly",
  "monthly",
])
export const tokenTypeEnum = pgEnum("donationTokenTypeEnum", ["TOKEN", "NFT"]);
export const events = pgTable("events", {
  id: text("id").$default(() => nanoid(10))
  .primaryKey()
});
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
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),

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
  referralFeesInFiat: real("referralFeesInFiat").default(0),
  referral: text("referral"),
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
  feePercentage: real('fee_percentage').default(5).notNull(),
  payoutAddressOnEvm: text('payout_address_on_evm'),
  settlementType: settlementTypeEnum('settlement_type').default('payout'),
  feeAmount: real('fee_amount'), // optional
  referral: text('referral'), // optional
  referralPercentage: real('referral_percentage').default(20).notNull(), // optional
  industry: text('industry'), // optional
  expectedMonthlyVolume: real('expected_monthly_volume'), // optional
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});
export const errorMessage = pgTable("error_message", {
  id: text("id").primaryKey().$default(() => nanoid(10)),
  message: text("message").notNull(),
  projectId: text("projectId").references(() => projects.projectId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
})
export const errorMessageRelations = relations(errorMessage, ({ one }) => ({
  project: one(projects, {
    fields: [errorMessage.projectId],
    references: [projects.projectId],
  })
}))
export const payoutTransactions = pgTable("payout_transactions", {
  projectId: text("projectId").references(() => projects.projectId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }).notNull(),
  payoutSettings: text("payoutSettings").references(() => payoutSettings.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }).notNull(),
  status: transactionStatusEnum("status").default("pending"),
  amountInFiat: real("amountInFiat").default(0).notNull(),
  platFromFeesInFiat: real("platFromFeesInFiat").default(0).notNull(),
  onChainTransactionId: text("onChainTransactionId"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
})
export const payoutBalance = pgTable("payout_balance", {
  projectId: text("projectId").references(() => projects.projectId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  balance: real("balance").default(0).notNull(),
  currency: text("currency").default("USD").notNull(),
  paidOut: real("paidOut").default(0).notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
})
export const payoutBalanceRelations = relations(payoutBalance, ({ one }) => ({
  project: one(projects, {
    fields: [payoutBalance.projectId],
    references: [projects.projectId],
  })
}))
export const payoutTransactionsRelations = relations(payoutTransactions, ({ one }) => ({
  project: one(projects, {
    fields: [payoutTransactions.projectId],
    references: [projects.projectId],
  }),
  payoutSetting: one(payoutSettings, {
    fields: [payoutTransactions.payoutSettings],
    references: [payoutSettings.id],
  })
}))
export const payoutSettings = pgTable("payouts_settings", {
  blockchain: blockchainTypesEnum("blockchain").notNull().default("evm"),
  chainId: integer("chainId").default(0).notNull(),
  payoutAddress: text("payoutAddress"),
  isActive: boolean("isActive").default(false).notNull(),
  payoutPeriod: payoutPeriodTypeEnum("payoutPeriod").notNull(),
  settlementType: settlementTypeEnum('settlement_type').default('payout'),
  id: text("id").$default(() => nanoid(10)).primaryKey(),
  projectId: text("projectId").references(() => projects.projectId, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
})
export const payoutSettingRelations = relations(payoutSettings, ({ one }) => ({
  project: one(projects, {
    fields: [payoutSettings.projectId],
    references: [projects.projectId],
  })
}))
export const projectsRelations = relations(projects, ({ one,many }) => ({
  referralProject: one(projects, {
    fields: [projects.referral],
    references: [projects.projectId],
  }),
  errorMessages: many(errorMessage),
  payoutSettings: many(payoutSettings)
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
  }),
  isAdmin: boolean("isAdmin").default(false),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).$default(() => new Date()),
  onBoardStage: onBoardStageEnum("onBoardStage").default("no-project-created"),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).$onUpdate(() => new Date()),
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
