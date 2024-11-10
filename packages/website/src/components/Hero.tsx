import LinkButton from "./hexta-ui/LinkButton";
import { FaArrowRight } from "react-icons/fa";
import gsap from "gsap";
import SplitType from "split-type";
import { useEffect, useRef } from "react";
import { stagger } from "framer-motion";
import BookACall from "./book-call-button";
import TeamPolaroids from "./team";

export const Hero = () => {
  // useEffect(() => {
  //   const text = SplitType.create("#hero-subheading-1");
  //   const text2 = SplitType.create("#hero-subheading-2");

  //   gsap.to(".char", {
  //     y: 0,
  //     stagger: 0.01,
  //     duration: 0.1,
  //   });
  //   gsap.to("#hero-heading", {
  //     y: 0,
  //     skewY: -2,
  //     scale: 1,
  //     ease: "expo.inOut",
  //     stagger: 0.01,
  //     duration: 1,
  //   });
  //   gsap.to("#hero-buttons", {
  //     opacity: 1,
  //     duration: 1,
  //   });
  // }, []);

  return (
    <>
      <section
        className="pt-40 mx-auto pb-24 flex items-center gap-4 justify-center flex-col w-full text-center  max-w-4xl overflow-hidden"
        id="hero"
      >
        <TeamPolaroids />
        <div className="flex flex-col gap-6 max-w-3xl text-balance">
          <p className="opacity-80" id="hero-subheading-1">
            Hello, We are Normies 👋
          </p>
          <div className="overflow-hidden">
            <h1
              className="max-w-[60rem] w-full text-3xl md:text-6xl sm:text-5xl tracking-tight bricolage-fonts font-bold"
            >
              Expand Your Reach by 50% with
              <span className="opacity-40">
                {" "}
                Seamless Fiat Integration
              </span>.{" "}
            </h1>
          </div>
          <p className="opacity-80" id="hero-subheading-2">
            Unlock new user segments by enabling fiat payments, simplified
            onboarding, and hassle-free crypto interactions. Join our waitlist
            to revolutionize Web3 accessibility.
          </p>
        </div>
        {/* <div className="flex gap-4 flex-wrap opacity-0"> */}
          <BookACall />
          {/* <LinkButton variant="link" href="#Services" className="w-fit grow">
            Services
          </LinkButton> */}
        {/* </div> */}
      </section>
    </>
  );
};
