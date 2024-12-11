import { auth } from "@/server/auth";
import { SessionProvider } from "next-auth/react";
import Providers from "./providers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      
      <Providers>{children}</Providers>
    </SessionProvider>
  );
}
