import { ArrowRight, Coins, CreditCard } from 'lucide-react'
import Image from 'next/image'

export default function PaymentFlow() {
  return (
    <section className="py-16 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-12 text-center w-full">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex flex-col items-center">
            <CreditCard className="w-16 h-16 text-[#00B67A] mb-4" />
            <p className="text-xl font-semibold">$100</p>
            <p className="text-gray-400">Credit Card</p>
          </div>
          <ArrowRight className="w-8 h-8 text-[#00B67A] transform rotate-90 md:rotate-0" />
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 relative mb-4">
              <Image
                src="/NormieLogo.png"
                alt="Normie Tech Logo"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <p className="text-xl font-semibold">normie.tech</p>
          </div>
          <ArrowRight className="w-8 h-8 text-[#00B67A] transform rotate-90 md:rotate-0" />
          <div className="flex flex-col items-center">
            {/* <div className="w-16 h-16 relative mb-4">
              <Image
                src="/NormieLogo.png"
                alt="USDC Logo"
                layout="fill"
                objectFit="contain"
              />
            </div> */}
            <Coins className="w-16 h-16 text-[#00B67A] mb-4" />
            <p className="text-xl font-semibold">100 USDC</p>
          </div>
        </div>
      </div>
    </section>
  )
}