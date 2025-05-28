import { Intro } from "@/components/layout/Intro";
import "../styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";
import GridPattern from "@/components/grid-pattern";
import Script from "next/script";
import { PHProvider } from "@/components/posthog-provider";
// import { getBootstrapData } from "@/utilts/get-bootstrap-data";
import { Toaster } from "sonner";
import {Toaster as ShadcnToaster} from "@/components/ui/toaster";
import { GoogleTagManager } from '@next/third-parties/google';
import AryanHeader from "@/components/aryan-component/aryan-header";
import { auth } from "@/server/auth";
import {NextIntlClientProvider} from 'next-intl';
import {
  getProjectById
} from "@normietech/core/config/project-registry/utils";
import { getLocale } from "next-intl/server";
import { QueryClientProvider } from "@tanstack/react-query";
import Providers from "./dashboard/providers";
export const metadata: Metadata = {
  title: "Normie",
  description: "Send fiat directly into your smart contracts.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const bootstrapData = await getBootstrapData();
  const session = await auth()
  const locale = await getLocale();

  return (
   
    <html lang="en">
    <Providers>
      
      <Toaster /> 
     
      <GoogleTagManager gtmId="GTM-N8NVKGJ6" />
      <PHProvider>
      <NextIntlClientProvider locale={locale}>
        <body
          className={`font-sans isolate antialiased relative dark min-h-screen`}
        >
          
          <GridPattern
            className="absolute -top-14 inset-x-0 -z-10 h-screen w-full dark:fill-secondary/30 fill-neutral-100 dark:stroke-secondary/30 stroke-neutral-700/5 [mask-image:linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
            yOffset={-96}
            interactive
          />
          <AryanHeader session={session} projectId={session?.user?.projectId || ""} />
         
          {children}
         
          <ShadcnToaster />
          <Footer />
         
          
        </body>
        </NextIntlClientProvider>
        </PHProvider>
      {/* </PHProvider> */}
      </Providers>
    </html>
    
  );
}
