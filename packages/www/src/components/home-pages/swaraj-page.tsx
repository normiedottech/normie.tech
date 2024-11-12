"use client";

import ContactSection from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { CryptoOnboardingAnalysis } from "@/components/crypto-onboarding-analysis";
import PlatformOverview from "@/components/stats/performace";
import { Navbar } from "../layout/Navbar";

const companies = [
  { name: "Voicedeck", logo: "/logos/voicedeck.svg" },
  {
    name: "The BioFi Project",
    logo: "https://cdn.prod.website-files.com/642c02d461ba26475b4fcdce/6718c9235b19546b977aa946_BioFi%20Logo%20(1)%20-%20Tyler%20Wakefield.png",
  },
  {
    name: "Ma Earth",
    logo: "https://cdn.prod.website-files.com/642c02d461ba26475b4fcdce/6718c8f84ad2d609c6f18229_Ma-Earth-Profile-Pic%20-%20Matthew%20Monahan.png",
  },
  {
    name: "Regen Coordination",
    logo: "https://cdn.prod.website-files.com/642c02d461ba26475b4fcdce/6718c98306a9af320f263d23_Group%205551008%20-%20Monty%20Bryant.png",
  },
];

const stats = [
  { value: 6, label: "Platforms", max: 10 },
  { value: 300, label: "Users", max: 500 },
  { value: 11000, label: "Processed", max: 15000 },
];

export default function Home() {
  return (
    <main className="px-[5rem] max-[565px]:px-[1rem]">
       <Navbar />
      <Hero />
      <PlatformOverview companies={companies} stats={stats} />
      <Services />
      <CryptoOnboardingAnalysis />
      <ContactSection />
    </main>
  );
}
