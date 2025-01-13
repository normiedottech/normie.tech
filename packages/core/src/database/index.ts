import { drizzle } from "drizzle-orm/neon-http";

import { neon } from "@neondatabase/serverless";
import { Schema } from "./schema/index";
import { Resource } from "sst";


const sql = neon(Resource.DATABASE_URL.value);
export const db = drizzle({ client: sql,schema: Schema});