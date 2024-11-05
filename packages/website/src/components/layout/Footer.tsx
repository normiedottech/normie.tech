'use client';

import Link from "next/link";
import { FaTwitter } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";

export const Footer = () => {
  return (
    <>
      <footer
        className="flex justify-between flex-wrap py-5 px-[5rem] max-[565px]:px-[1rem] border-t  border-opacity-10 border-white items-center gap-3 "
        
      >
        <div>
          <p className="text-sm">
            <span className="opacity-80">Built with ❤️ by </span>
            <Link
              className="link-blue"
              href="https://ui.hextastudio.in"
              target="_blank"
            >
              @HextaUI
            </Link>
          </p>
        </div>
        <div className="flex gap-1">
          <Link
            href="https://twitter.com/hextastudio"
            className="p-2 rounded hover:bg-zinc-600 hover:bg-opacity-20"
            target="_blank"
          >
            <FaTwitter size={17} />
          </Link>
          <Link
            href="https://dsc.gg/hextastudio"
            className="p-2 rounded hover:bg-zinc-600 hover:bg-opacity-20"
            target="_blank"
          >
            <FaDiscord size={17} />
          </Link>
        </div>
      </footer>
    </>
  );
};
