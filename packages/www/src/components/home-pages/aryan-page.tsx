import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { LogoMarquee } from "../stats/logo-marque";
import BookNoahACall from "../aryan-component/book-a-call";
import AryanContactSection from "../aryan-component/aryan-contactform";
import PaymentFlow from "../aryan-component/paymnet-flow";

export default function LandingPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(48);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient from-black via-gray-900 to-black bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-7xl px-4 ">
          <div className="flex justify-between items-center py-4">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/NormieLogo.png"
                  alt="Normie Tech Logo"
                  width={180}
                  height={50}
                  className="h-10 w-auto bg-[#00B67A]/35 rounded-xl "
                />
                <h1 className="text-xl font-bold">NORMIE TECH</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center justify-center ">
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-7xl font-bold mb-6">
              Simplifying <span className="text-[#00B67A]">Fiat to Crypto</span>{" "}
              Payments
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Customers pay in fiat. You receive it in crypto.
            </p>
            <div className="w-full flex justify-center">
              <BookNoahACall />
            </div>
          </div>

          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#00B67A]/20 to-transparent blur-3xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,182,122,0.1),transparent_70%)]" />
          </div>
        </section>

        {/* how it works */}
        <PaymentFlow />

        {/* Stats Section */}
        <section className=" py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl mb-12 text-center w-full">Our Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className=" p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#00B67A] mb-2">No KYC on customers</h3>
                <p className="">Simplify the onboarding process for your users.</p>
              </div>
              <div className=" p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#00B67A] mb-2">Fully compliant</h3>
                <p className="">Operate with peace of mind, adhering to all regulations.</p>
              </div>
              <div className=" p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#00B67A] mb-2">Based in the USA</h3>
                <p className="">Servicing all over the world.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <Card className="border-none bg-black mt-24">
          <CardContent className="overflow-hidden py-14">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">
              Our Clients
            </h2>
            <LogoMarquee companies={companies} />
          </CardContent>
        </Card>

        
        {/* Contact Form Section */}
        <AryanContactSection />
      </main>
    </div>
  );
}
