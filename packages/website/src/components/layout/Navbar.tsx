'use client';

import { useState } from "react";
import {
  Link as ScrollLink,
  animateScroll as scroll,
  scroller,
} from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [activeLink, setActiveLink] = useState<string | null>("Home");

  const handleClick = (link: string) => {
    setActiveLink(link);
    if (link === "Home") {
      scroll.scrollToTop();
    } else {
      scroller.scrollTo(link, {
        duration: 800,
        delay: 0,
        smooth: "easeInOutQuart",
      });
    }
  };

  const namedOnClickHandler = (link: string) => () => handleClick(link);

  return (
    <>
      <nav className="flex justify-center items-center max-w-[22rem] mx-auto w-[full] py-2 border border-white border-opacity-10 text-sm  rounded-full mt-5 my-4 scale-[1.04] fixed left-[50%] translate-x-[-50%] px-4 z-[3] shadow-lg bg-foreground text-background overflow-hidden">
        <ul className="flex">
          {["Home", "Services", "Projects", "Contact"].map((link) => (
            <li key={link} className="relative py-2">
              <ScrollLink
                to={link}
                spy={true}
                smooth={true}
                offset={-200}
                onClick={namedOnClickHandler(link)}
                className={`rounded-full py-2 px-4 hover:opacity-100 transition-opacity z-[2] cursor-pointer ${
                  activeLink !== link ? "opacity-80" : "opacity-100"
                }`}
              >
                {link}
              </ScrollLink>
              <AnimatePresence>
                {activeLink === link && (
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 right-0 z-[1] underline bg-zinc-600 bg-opacity-20 rounded-full py-3 "
                    layoutId="underline"
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                  >
                    <span className="w-[40px] h-[1px] absolute bottom-0 left-[50%]  translate-x-[-50%]  bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-md  shadow-orange-500 "></span>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};
