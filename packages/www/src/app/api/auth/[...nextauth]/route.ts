import { handlers } from "@/server/auth" // Referring to the auth.ts we just created
export const { GET, POST } = handlers

// import { authOptions } from "@/auth";
// import NextAuth from "next-auth/next";

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };