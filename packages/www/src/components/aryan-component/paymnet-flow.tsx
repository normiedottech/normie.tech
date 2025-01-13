import { ArrowRight, Coins, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function PaymentFlow() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <section className="w-full py-12 bg-gradient-to-b  text-white">
      <div className="w-full mx-auto ">
        <h2 className="text-3xl font-extrabold sm:text-4xl mb-16 text-center w-full ml-4">How It Works</h2>
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-center gap-8 w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex flex-col items-center" variants={itemVariants}>
            <div className=" p-6 mb-3 bg-[#00B67A]/40 rounded-full">
              <CreditCard className="w-16 h-16 text-[#00B67A]" />
            </div>
            <p className="text-2xl font-semibold">$100</p>
            <p>Customer's Credit Card</p>
          </motion.div>
          <ArrowRight className="w-10 h-8 ttransform rotate-90 md:rotate-0 my-4 md:my-0" />
          <motion.div className="flex flex-col items-center mb-4 " variants={itemVariants}>
            <div className="w-32 h-32 relative  mb-2 bg-[#00B67A]/40 rounded-full p-4">
              <Image
                src="/NormieLogo.png"
                alt="Normie Tech Logo"
                layout="fill"
                objectFit="contain"
                
              />
            </div>
            <p className="text-2xl font-semibold">normie.tech</p>
           
          </motion.div>
          <ArrowRight className="w-16 h-8 transform rotate-90 md:rotate-0 my-4 md:my-0" />
          <motion.div className="flex flex-col items-center " variants={itemVariants}>
            <div className=" p-6 mb-4 bg-[#00B67A]/40 rounded-full">
              <Coins className="w-16 h-16 text-[#00B67A]" />
            </div>
            <p className="text-2xl font-semibold">100 USDC</p>
            <p>Your wallet</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}