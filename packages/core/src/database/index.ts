// import { drizzle } from "drizzle-orm/neon-http";
import {drizzle} from "drizzle-orm/postgres-js"
import { neon } from "@neondatabase/serverless";
import { Schema } from "./schema/index";
import { Resource } from "sst";
import postgres from "postgres";

const sql = postgres(Resource.DATABASE_URL.value);
export const db = drizzle({ client: sql,schema: Schema});