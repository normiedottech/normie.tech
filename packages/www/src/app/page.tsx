"use client";

import AryanPage from "@/components/home-pages/aryan-page";
import SwarajPage from "@/components/home-pages/swaraj-page";
import { PostHogFeature } from "posthog-js/react";

const FEATURE_FLAG = "home-page-conversion";

const variants = {
  Control: "control",
  Swaraj: "swaraj",
  Aryan: "aryan",
} as const;

export default function Home() {
  return (
    <>
      <PostHogFeature match={variants.Control} flag={FEATURE_FLAG}>
        <SwarajPage />
      </PostHogFeature>
      <PostHogFeature match={variants.Swaraj} flag={FEATURE_FLAG}>
        <SwarajPage />
      </PostHogFeature>
      <PostHogFeature match={variants.Aryan} flag={FEATURE_FLAG}>
        <AryanPage />
      </PostHogFeature>
    </>
  );
}
