import { Intro } from "@/components/layout/Intro";
import "../styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";
import GridPattern from "@/components/grid-pattern";

export const metadata: Metadata = {
  title: "Normie",
  description: "Send fiat directly into your smart contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className={`font-sans isolate antialiased relative dark`}>
        {/* <Intro /> */}
        <Navbar />
        <GridPattern
          className="absolute -top-14 inset-x-0 -z-10 h-screen w-full dark:fill-secondary/30 fill-neutral-100 dark:stroke-secondary/30 stroke-neutral-700/5 [mask-image:linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
          yOffset={-96}
          interactive
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}
