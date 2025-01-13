"use client";

import AryanPage from "@/components/home-pages/aryan-page";
import SwarajPage from "@/components/home-pages/swaraj-page";
import { PostHogFeature } from "posthog-js/react";
import { env } from "../../env";
import GrowLandingPage from "@/components/home-pages/landing-page";

const FEATURE_FLAG = "home-page-conversion";



export default function Home() {
  return (
    <>
       {/* <AryanPage /> */}
       <GrowLandingPage />
    </>
  );
}
