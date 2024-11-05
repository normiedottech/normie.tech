import LinkButton from "./hexta-ui/LinkButton";
import { FaArrowRight } from "react-icons/fa";
import gsap from "gsap";
import SplitType from "split-type";
import { useEffect, useRef } from "react";
import { stagger } from "framer-motion";
import BookACall from "./book-call-button";
import TeamPolaroids from "./team";

export const Hero = () => {
  useEffect(() => {
    const text = SplitType.create("#hero-subheading-1");
    const text2 = SplitType.create("#hero-subheading-2");

    gsap.to(".char", {
      y: 0,
      stagger: 0.01,
      delay: 3.4,
      duration: 0.1,
    });
    gsap.to("#hero-heading", {
      y: 0,
      skewY: -2,
      scale: 1,
      ease: "expo.inOut",
      stagger: 0.01,
      delay: 3,
      duration: 1.4,
    });
    gsap.to("#hero-buttons", {
      opacity: 1,
      delay: 3.6,
      duration: 1.4,
    });
  }, []);

  return (
    <>
      <section
        className=" min-h-screen flex items-start justify-center flex-col px-[5rem] max-[565px]:px-[1rem] gap-6 overflow-hidden"
        id="hero"
      >
        <TeamPolaroids />
        <div className="flex flex-col gap-6 max-w-3xl text-balance">
          <div className="overflow-hidden">
            <p className="opacity-80" id="hero-subheading-1">
              Hello, We are Normies 👋
            </p>
          </div>
          <div className="overflow-hidden">
            <h1
              className="max-w-[60rem] w-full text-6xl tracking-tight  bricolage-fonts font-bold   translate-y-[20rem] skew-y-2 scale-105"
              id="hero-heading"
            >
              Expand Your Reach by 50% with
              <span className="opacity-40">
                {" "}
                Seamless Fiat Integration
              </span>.{" "}
            </h1>
          </div>
          <div className="overflow-hidden">
            <p className="opacity-80" id="hero-subheading-2">
              Unlock new user segments by enabling fiat payments, simplified
              onboarding, and hassle-free crypto interactions. Join our waitlist
              to revolutionize Web3 accessibility.
            </p>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap opacity-0" id="hero-buttons">
          <BookACall />
          <LinkButton variant="link" href="#Services" className="w-fit grow">
            Services
          </LinkButton>
        </div>
      </section>
    </>
  );
};
