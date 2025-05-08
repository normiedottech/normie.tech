"use server";

import { auth } from "@/server/auth";
import { db } from "@normietech/core/database/index";
import { referrers } from "@normietech/core/database/schema/index";
import { count, eq } from "drizzle-orm";

