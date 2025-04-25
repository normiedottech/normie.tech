// import NextAuth from "next-auth";
// import type { NextAuthOptions } from "next-auth"
// import { JWT } from "next-auth/jwt";

// async function refreshAccessToken(token: JWT): Promise<JWT> {
//   try {
//     const url =
//       `${process.env.AUTHGEAR_ISSUER}/oauth2/token?` +
//       new URLSearchParams({
//         client_id: process.env.AUTHGEAR_CLIENT_ID!,
//         client_secret: process.env.AUTHGEAR_CLIENT_SECRET!,
//         grant_type: 'refresh_token',
//         refresh_token: token.refreshToken as string
//       });

//     const response = await fetch(url, {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       method: 'POST'
//     });

//     const refreshedTokens = await response.json();

//     if (!response.ok) {
//       throw refreshedTokens;
//     }

//     return {
//       ...token,
//       accessToken: refreshedTokens.access_token,
//       accessTokenExpires: refreshedTokens.expires_at,
//       refreshToken: refreshedTokens.refresh_token ?? token.refreshToken // Fall back to old refresh token
//     };
//   } catch (error) {
//     console.error("Error refreshing access token:", error);
//     return {
//       ...token,
//       error: 'RefreshAccessTokenError'
//     };
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     {
//       id: "authgear",
//       name: "Authgear",
//       type: "oauth",
//       issuer: process.env.AUTHGEAR_ISSUER,
//       clientId: process.env.AUTHGEAR_CLIENT_ID,
//       clientSecret: process.env.AUTHGEAR_CLIENT_SECRET,
//       wellKnown: `${process.env.AUTHGEAR_ISSUER}/.well-known/openid-configuration`,
//       authorization: { params: { scope: "openid offline_access https://authgear.com/scopes/full-userinfo" } },
//       client: {
//         token_endpoint_auth_method: "client_secret_post",
//       },
//       profile(profile) {
//         return {
//           id: profile.sub,
//         };
//       }
//     }
//   ],
//   callbacks: {
//     async jwt({ token, user, account }) {
//       // Initial sign in
//       if (account && user) {
//         return {
//           accessToken: account.access_token,
//           accessTokenExpires: account.expires_at,
//           refreshToken: account.refresh_token,
//           user
//         };
//       }
      
//       // Return previous token if the access token has not expired yet
//       if (token.accessTokenExpires && Date.now() < token.accessTokenExpires * 1000) {
//         return token;
//       }
      
//       // Access token has expired, try to update it
//       return refreshAccessToken(token);
//     },
//     async session({ session, token }: { session: any; token: JWT }) {
//       session.user = token.user;
//       session.token = token;
//       session.user.phone_number = token.phone_number;
//       session.accessToken = token.accessToken;
//       session.error = token.error;
      
//       return session;
//     }
//   },
// };

// export default NextAuth(authOptions);