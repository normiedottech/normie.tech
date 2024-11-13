import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { LogoMarquee } from '../stats/logo-marque'
import BookNoahACall from '../aryan-component/book-a-call'
import AryanContactSection from '../aryan-component/aryan-contactform'

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
                  className="h-12 w-auto"
                />
                <h1 className='text-xl font-bold'>NORMIE TECH</h1>
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
              Simplifying <span className="text-[#00B67A]">Fiat to Crypto</span> Payments
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Eliminate crypto onboarding friction with our effortless fiat to crypto integration.
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

        {/* Stats Section */}
        <section id="stats" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[url('/placeholder.svg?height=600&width=800')] bg-cover bg-center"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">Our Impact</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              <Card className="bg-gray-900 border-[#00B67A] w-64 h-64">
                <CardContent className="flex flex-col items-center  justify-center h-full">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform rotate-180" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-700"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="44"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-[#00B67A]"
                        strokeWidth="8"
                        strokeDasharray={`${progress * 2.76} 276`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="44"
                        cx="50"
                        cy="50"
                        style={{
                          transition: "stroke-dasharray 1s ease-in-out",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-[#00B67A]">{progress}%</span>
                      <span className="text-sm text-gray-300">Increase in</span>
                      <span className="text-sm text-gray-300">User Reach</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="max-w-md text-center md:text-left">
              
                {/* <h3 className="text-2xl font-bold text-white  mb-4">
                  Our platform has significantly increased user reach, making crypto payments more accessible than ever before.
                </h3> */}
                <p className="text-3xl   text-[#00B67A] font-semibold">
                  Fully compliant in the USA with no KYC requirements
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <Card className="border-none bg-black mt-24">
          <CardContent className="overflow-hidden py-14">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">Our Partners</h2>
            <LogoMarquee companies={companies} />
          </CardContent>
        </Card>

        {/* Services Section */}
        <section id="services" className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-8">Our Services</h2>
            <p className="mt-4 text-xl text-gray-300 mb-12">We provide comprehensive solutions to streamline fiat to crypto payments.</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gray-900 border-[#00B67A]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#00B67A] mb-2">Fiat Payments</h3>
                  <p className="text-gray-300">Accept traditional currency payments seamlessly, expanding your user base.</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-[#00B67A]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#00B67A] mb-2">Web2 Login</h3>
                  <p className="text-gray-300">Simplify user onboarding with familiar authentication methods.</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-[#00B67A]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#00B67A] mb-2">Gasless Transactions</h3>
                  <p className="text-gray-300">Remove barriers to entry by eliminating gas fees for users.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-8 text-center">See one of our client</h2>
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/LBxIZkRBPTU?si=jxPSnREl7s3Cv-Ud" title="YouTube video player"   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen  className='w-full lg:h-[550px]'></iframe>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
       <AryanContactSection/>
      </main>
    </div>
  )
}