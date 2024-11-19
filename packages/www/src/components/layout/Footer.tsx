"use client";

import Link from "next/link";
import { FaTwitter } from "react-icons/fa";

import Image from "next/image"; 

export const Footer = () => {
  return (
    <>
      <footer className="flex justify-between flex-wrap py-5 px-4 border-t  border-opacity-10 border-white items-center gap-3 ">
        <div>
          <div className="flex  items-center gap-2 text-sm ">
          <Image
                  src="/NormieLogo.png"
                  alt="Normie Tech Logo"
                  width={180}
                  height={50}
                  className="h-10 w-auto bg-[#00B67A]/35 rounded-xl"
                />
            <div>
              NormieTech
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Link
            href="https://x.com/normietech"
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-600 hover:bg-opacity-20"
            target="_blank"
          >
            <FaTwitter size={17} />
            <span>x.com/normietech</span>
          </Link>
          {/* <Link
            href="https://dsc.gg/hextastudio"
            className="p-2 rounded hover:bg-zinc-600 hover:bg-opacity-20"
            target="_blank"
          >
            <FaDiscord size={17} />
          </Link> */}
        </div>
      </footer>
    </>
  );
};
