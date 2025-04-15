import { drizzle } from "drizzle-orm/neon-http";

import { neon } from "@neondatabase/serverless";
import { Resource } from "sst";
import { Schema } from "./schema/index";

const sql = neon(Resource.DATABASE_URL.value);
export const db = drizzle({ client: sql, schema: Schema });
