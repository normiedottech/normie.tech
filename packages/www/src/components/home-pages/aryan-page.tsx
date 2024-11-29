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
import Link from "next/link";
import AryanGlobeDemo from "../aryan-component/aryan-globe";

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
              <Link href="#contact" className="w-full md:w-[70%]">
                <Button className="w-full md:w-[70%]  bg-[#00B67A] text-white hover:bg-[#009966] ">
                  CONTACT US
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-tabs"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M15 2v20"/><path d="M15 7h5"/><path d="M15 12h5"/><path d="M15 17h5"/></svg>
                </Button>
              </Link>
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


        {/* New Section: Receive payments from everywhere */}
 <section className="relative overflow-hidden">
          <div className="max-w-7xl h-full mx-auto px-3 flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Receive payments from <span className="text-[#00B67A]">everywhere</span>
              </h2>
              <p className="text-xl text-gray-300">
                Our global payment solution allows you to accept payments from customers worldwide, 
                expanding your reach and growing your business across borders.
              </p>
            </div>
            <div className="w-full md:w-2/3 relative ">
              {/* <Image
                src="/placeholder.svg?height=400&width=400"
                alt="Globe illustration"
                width={400}
                height={400}
                className="rounded-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" /> */}
              <AryanGlobeDemo />
            </div>
          </div>
        </section>


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

{/* Demo video */}
        <section className="relative overflow-hidden py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">
              See How It Works
            </h2>
            <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
              <video
                className="w-full h-full object-cover"
                controls
                poster="/video-thumbnail.jpg"
              >
                <source src="/demovideo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>


        {/* Contact Form Section */}
        <AryanContactSection />
      </main>
    </div>
  );
}

