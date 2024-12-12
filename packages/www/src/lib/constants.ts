import { env } from "../../env";

export const API_URL = typeof window === "undefined" ? env.API_URL : env.NEXT_PUBLIC_API_URL