"use client";
import posthog, { BootstrapConfig } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function PHProvider({
  children,
  bootstrapData,
}: {
  children: React.ReactNode;
  bootstrapData: BootstrapConfig;
}) {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      bootstrap: bootstrapData,
    });
    const toolbarJSON = new URLSearchParams(
      window.location.hash.substring(1)
    ).get("__posthog");
    if (toolbarJSON) {
      posthog.loadToolbar(JSON.parse(toolbarJSON));
    }
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
