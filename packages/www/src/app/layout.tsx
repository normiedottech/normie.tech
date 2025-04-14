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
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { GoogleTagManager } from "@next/third-parties/google";
import AryanHeader from "@/components/aryan-component/aryan-header";
import { auth } from "@/server/auth";
import { getProjectById } from "@normietech/core/config/project-registry/utils";
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
	const session = await auth();

	return (
		<html lang="en">
			<Toaster />

			<GoogleTagManager gtmId="GTM-N8NVKGJ6" />
			<PHProvider>
				<body
					className={`font-sans isolate antialiased relative dark min-h-screen`}
				>
					<GridPattern
						className="absolute -top-14 inset-x-0 -z-10 h-screen w-full dark:fill-secondary/30 fill-neutral-100 dark:stroke-secondary/30 stroke-neutral-700/5 [mask-image:linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
						yOffset={-96}
						interactive
					/>
					<AryanHeader
						session={session}
						projectId={session?.user?.projectId || ""}
					/>

					{children}

					<ShadcnToaster />
					<Footer />
				</body>
			</PHProvider>
			{/* </PHProvider> */}
		</html>
	);
}
