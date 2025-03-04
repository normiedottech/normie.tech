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
import FeedbackSection from "../aryan-component/feedback-section";
import { CryptoOnboardingAnalysis } from "@/components/crypto-onboarding-analysis";
import demoGif from "../../../public/normiedemo(2)(2)-min.gif" 

export default function GrowLandingPage() {
  const [progress, setProgress] = useState(0);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setProgress(48);
  //   }, 500);
  //   return () => clearTimeout(timer);
  // }, []);

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
    {
      name:"Grassroots Economics",
      logo:"/grassroots_brand.png"
    },
    // {
    //  name:"Breadchain",
    //   logo:"/breadchain_brand.svg"
    // },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <main className="">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center ">
          <div className="relative mt-12 z-10 lg:flex items-center space-y-8 lg:space-y-0 lg:space-x-8 text-center mx-auto px-10">
            <div className="text-start items-start max-w-2xl">
              <h1 className="text-3xl lg:text-5xl font-bold mb-6">
              Let Your Smart Contract {" "}
                <span className="text-[#00B67A]">Accept Credit Card</span>{" "}
                Payments
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
              Customers pay in fiat. You receive it in stablecoins.
              </p>
             
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4  ">
                <Link href="/dashboard/sign-in" className="w-full sm:w-auto">
                  <Button size='lg' className="w-full sm:w-auto bg-[#00B67A] text-white hover:bg-[#009966] transition-colors duration-300">
                    Get Started
                  </Button>
                </Link>
                <Link href="#contact" className="w-full sm:w-auto">
                  <Button size='lg' className="w-full sm:w-auto bg-transparent text-[#00B67A] hover:bg-[#00B67A] hover:text-white border-2 border-[#00B67A] transition-colors duration-300">
                    Contact Us
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-notebook-tabs ml-2"
                    >
                      <path d="M2 6h4" />
                      <path d="M2 10h4" />
                      <path d="M2 14h4" />
                      <path d="M2 18h4" />
                      <rect width="16" height="20" x="4" y="2" rx="2" />
                      <path d="M15 2v20" />
                      <path d="M15 7h5" />
                      <path d="M15 12h5" />
                      <path d="M15 17h5" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </div>
            <div className="">
              {/* <video
                className="w-full h-full rounded-lg aspect-square object-cover"
                controls
                poster="/demoimage.png"
              >
                <source src="/demovideo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video> */}
              <img
                src={demoGif.src} // Path to your GIF
                alt="A cool GIF"
                className="w-[600px] h-full rounded-lg  object-cover"
                width={700} // Optional: Set a width
                height={700} // Optional: Set a height
             
            />
            </div>
          </div>

          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#00B67A]/20 to-transparent blur-3xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,182,122,0.1),transparent_70%)]" />
          </div>
        </section>

        {/* Partners Section */}
        <Card className="border-none bg-black ">
          <CardContent className="overflow-hidden py-14">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">
              Our Clients
            </h2>
            <LogoMarquee companies={companies} />
          </CardContent>
        </Card>

        {/* how it works */}
        <PaymentFlow />

        {/* New Section: feature*/}
        <section className="relative overflow-hidden mt-28">
          <div className=" h-full mx-auto px-10 flex flex-col-reverse md:flex-row items-center lg:space-x-14 ">
          <div className="rounded-lg aspect-video">
             <CryptoOnboardingAnalysis />
            </div>

            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 ">
              Your customers want to pay you... 
                <span className="text-[#00B67A]"> Don't make it hard</span>
              </h2>
              <p className="text-xl text-gray-300 mb-3">
              3 out of 4 fiat to on-ramp attempts fail because it is too much customer friction. So we fixed it.
              </p>
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
              No more complex onboarding. Let your customers pay the way they are used to.
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden mt-8 lg:mt-0">
          <div className=" h-full mx-auto px-10 flex flex-col md:flex-row space-x-5 items-center justify-between">
            <div className="w-full mb-8 md:mb-0">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Get paid wherever your{" "}
                <span className="text-[#00B67A]">customer are</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Our global payments solution lets
                you say "yes" to more customers, no matter where they are.
              </p>
              <p className="text-xl text-gray-300">
                Stop limiting your business. Start accepting payments from
                everyone, everywhere.
              </p>
            </div>
            <div className="w-full relative  ">
              <AryanGlobeDemo />
            </div>
          </div>
        </section>

       

        <section className="relative overflow-hidden my-24">
          <div className=" h-full mx-auto px-10 flex flex-col-reverse md:flex-row items-center lg:space-x-14 ">
            <div className="md:w-1/2">
             <video
                className="w-full h-full rounded-lg aspect-video object-cover"
                controls
                poster="/demoimage.png"
              >
                <source src="/nokycvideo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              </div>
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Try It Out in 
                <span className="text-[#00B67A]"> 2 Minutes!</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
              Drop your wallet address. Get your payment link. Watch the money flow. 
              KYC is required on the receiver.
              </p>
            </div>
            {/* <Image
              src="/fullycompliant1.webp"
              alt="Globe illustration"
              width={400}
              height={400}
              className="lg:w-[50%] rounded-lg aspect-square object-cover"
            /> */}
          </div>
        </section>

        {/* Demo video */}
        {/* <section className="relative overflow-hidden py-20">
          <div className="max-w-4xl text-center mx-auto px-4">
            <h1 className="text-3xl md:text-7xl font-bold mb-6">
              Accept Crypto, <span className="text-[#00B67A]">Worry-Free-</span>{" "}
              Start Now!
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              The compliant crypto payment solution thats built for speed and
              scale.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center ">
              <Link href="/dashboard/sign-in" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#00B67A] text-white hover:bg-[#009966] transition-colors duration-300">
                  Get Started
                </Button>
              </Link>
              <Link href="#contact" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-transparent text-[#00B67A] hover:bg-[#00B67A] hover:text-white border-2 border-[#00B67A] transition-colors duration-300">
                  Contact Us
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-notebook-tabs ml-2"
                  >
                    <path d="M2 6h4" />
                    <path d="M2 10h4" />
                    <path d="M2 14h4" />
                    <path d="M2 18h4" />
                    <rect width="16" height="20" x="4" y="2" rx="2" />
                    <path d="M15 2v20" />
                    <path d="M15 7h5" />
                    <path d="M15 12h5" />
                    <path d="M15 17h5" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section> */}
        <FeedbackSection />

        {/* Contact Form Section */}
        <AryanContactSection />
      </main>
    </div>
  );
}
