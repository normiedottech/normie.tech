  {/* Left Stats Circle */}
          {/* <div className="absolute left-[-5px] flex flex-col items-center">
            <div className="relative w-[300px] h-[300px] rounded-full border border-gray-800 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold">6+</div>
              <div className="text-gray-500 text-sm">Platforms</div>
              <div className="mt-4 text-3xl font-bold">$11K+</div>
              <div className="text-gray-500 text-sm">Processed</div>
            </div>
            <button className="mt-8 p-4 rounded-full border border-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div> */}

           {/* <div className="flex items-center space-x-4"> */}
            {/* <Button className="bg-[#00B67A] text-white hover:bg-[#009966] px-8 py-6 text-lg">
              Get Started
            </Button> */}

             {/* Right Stats Circle */}
          {/* <div className="absolute right-[-0.01rem] flex flex-col items-center">
            <div className="relative w-[300px] h-[300px] rounded-full border border-gray-800 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold">300+</div>
              <div className="text-gray-500 text-sm">Active Users</div>
              <div className="mt-4 text-3xl font-bold">50%</div>
              <div className="text-gray-500 text-sm">Growth</div>
            </div>
            <button className="mt-8 p-4 rounded-full border border-gray-800">
              <ArrowRight className="w-6 h-6" />
            </button>
          </div> */}

          {/* Platform Performance Section */}
        {/* <section id="performance" className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-8">Platform Performance</h2>
            <p className="mt-4 text-xl text-gray-300 mb-12">See how our solution is transforming the Web3 donation landscape.</p>
            <div className="h-auto bg-gray-900 rounded-lg p-4">
              <ChartContainer
                config={{
                  users: {
                    label: "Users",
                    color: "#00B67A",
                  },
                  transactions: {
                    label: "Transactions",
                    color: "#004D33",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis yAxisId="left" orientation="left" stroke="#00B67A" />
                    <YAxis yAxisId="right" orientation="right" stroke="#004D33" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar yAxisId="left" dataKey="users" fill="#00B67A" />
                    <Bar yAxisId="right" dataKey="transactions" fill="#004D33" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </section> */}

        {/* Partners Section */}
        {/* <section id="partners" className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-8">Our Trusted Partners</h2>
            <p className="mt-4 text-xl text-gray-300 mb-12">We're proud to work with leading organizations in the crypto and fintech space.</p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <img className="h-12 filter invert" src={`/placeholder.svg?height=48&width=120`} alt={`Partner ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </section> */}
         
 {/* <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-sm text-gray-400">Normie Tech is revolutionizing Web3 donations by making it easy for everyone to contribute using fiat currency.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-400 hover:text-[#00B67A]">Home</a></li>
                <li><a href="#performance" className="text-sm text-gray-400 hover:text-[#00B67A]">Performance</a></li>
                <li><a href="#partners" className="text-sm text-gray-400 hover:text-[#00B67A]">Partners</a></li>
                <li><a href="#services" className="text-sm text-gray-400 hover:text-[#00B67A]">Services</a></li>
                <li><a href="#contact" className="text-sm text-gray-400 hover:text-[#00B67A]">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#00B67A]">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">&copy; 2023 Normie Tech. All rights reserved.</p>
          </div>
        </div>
      </footer> */}

    //   <section id="contact" className="py-16 bg-black">
    //   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    //     <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-8">Get in Touch</h2>
    //     <p className="mt-4 text-xl text-gray-300 mb-12">Ready to revolutionize your fiat to crypto payments? Let's talk!</p>
    //     <div className="max-w-lg mx-auto">
    //       <form className="grid grid-cols-1 gap-6">
    //         <div>
    //           <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
    //           <Input type="text" name="name" id="name" className="mt-1 block w-full bg-gray-800 border-gray-700 text-white" placeholder="Your Name" />
    //         </div>
    //         <div>
    //           <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
    //           <Input type="email" name="email" id="email" className="mt-1 block w-full bg-gray-800 border-gray-700 text-white" placeholder="you@example.com" />
    //         </div>
    //         <div>
    //           <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
    //           <Textarea name="message" id="message" rows={4} className="mt-1 block w-full bg-gray-800 border-gray-700 text-white" placeholder="Your message here" />
    //         </div>
    //         <div>
    //           <Button type="submit" className="w-full bg-[#00B67A] text-white hover:bg-[#009966]">Send Message</Button>
    //         </div>
    //       </form>
    //     </div>
    //   </div>
    // </section>