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
    posthog.init("phc_AwsxaP902GDQRKyU0jTi9edD5ekDDA3opoGTSyFuCMV", {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.i.posthog.com",
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
