"use client";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { STAGE } from "@/lib/constants";
import dynamic from "next/dynamic";
import { env } from "../../env";

// Import the page view component dynamically with SSR disabled
const PostHogPageViewDynamic = dynamic(
	() => import("./posthog-page-view").then((mod) => mod.PostHogPageView),
	{ ssr: false },
);

export function PHProvider({ children }: { children: React.ReactNode }) {
	// Add state to track client-side initialization
	const [isPostHogReady, setIsPostHogReady] = useState(false);

	useEffect(() => {
		if (!isPostHogReady) {
			// Initialize PostHog
			posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY!, {
				api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
				capture_pageview: false, // Disable automatic pageview capture
				capture_pageleave: true,
			});

			setIsPostHogReady(true);
		}
	}, [isPostHogReady]);

	// Only render the PostHogProvider on the client side after initialization
	if (typeof window === "undefined") {
		return <>{children}</>;
	}

	return (
		<PostHogProvider client={posthog}>
			<PostHogPageViewDynamic />
			{children}
		</PostHogProvider>
	);
}
