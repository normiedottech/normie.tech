export * as Schema from "./index"
import { integer, json, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const paymentMetadataTable = pgTable("paymentMetadataTable", {
  id: varchar('id')
  .$default(() => nanoid(10))
  .primaryKey(),
  metadataJson: json('metadataJson').default({}),
  projectId: text('projectId'),
  paymentId: text('paymentId'),
  externalId: text('externalId'),
});