import React from 'react'
import Image from 'next/image'

export default function AryanHeader() {
  return (
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

  )
}
