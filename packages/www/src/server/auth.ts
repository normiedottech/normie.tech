import "server-only";
import NextAuth, { DefaultSession } from "next-auth";
import { Resource } from "sst";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@normietech/core/database/index";
import { users } from "@normietech/core/database/schema/index";
import { eq } from "drizzle-orm";
declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      projectId?: string;
      isAdmin: boolean;
      onBoardStage: typeof users.onBoardStage._.data
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }
}
export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  pages: {
    signIn: "/dashboard/signin",
  },
  trustHost: true,
  callbacks: {
    jwt: async ({ token }) => {
      if (!token.sub) {
        throw new Error("No sub");
      }

      const user = await db.query.users.findFirst({
        where: token.sub ? eq(users.id, token.sub) : undefined,
      });
      return {
        ...token,
        name: user?.name,
        email: user?.email,
        projectId: user?.projectId,
        onBoardStage: user?.onBoardStage
      };
    },
    async session({ session, token }) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
      });

      return {
        ...session,
        user: {
          ...session.user,
          projectId: user?.projectId,
          isAdmin: !!user?.isAdmin,
          onBoardStage:user?.onBoardStage ?? "no-project-created"
        },
      };
    },
  },
  secret: Resource.BETTER_AUTH_SECRET.value,
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      from: "support@normie.tech",
      apiKey: Resource.RESEND_API_KEY.value,
    }),
  ],
});
