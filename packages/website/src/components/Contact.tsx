import LinkButton from "./hexta-ui/LinkButton";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { MagneticButton } from "./MagneticButton";
gsap.registerPlugin(ScrollTrigger);

export const Contact = () => {
  const sectionRef = useRef(null);
  const rocketRef = useRef(null);

  useEffect(() => {
    gsap.to(rocketRef.current, {
      bottom: 0,
      right: 0,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "center",
        scrub: 0.3,
      },
    });
  }, []);
  return (
    <>
      <section
        className="flex items-start justify-start flex-col px-[5rem] max-[565px]:px-[1rem] gap-6 overflow-hidden mb-[8rem]"
        id="Contact"
        ref={sectionRef}
      >
        <div className="relative bg-white w-full p-4 py-6 rounded-2xl text-black flex-col gap-6 flex">
          <span
            className="z-[0]  pointer-events-none absolute right-[1rem] bottom-[-4rem] text-[10rem]"
            ref={rocketRef}
          >
            🚀
          </span>
          <div>
            <p className="relative text-5xl max-w-[30rem] bricolage-fonts font-bold z-[99]">
              Ready to skyrocket your brand?
            </p>
          </div>
          <div>
            <LinkButton
              href="https://ui.hextastudio.in"
              target="_blank"
              className="relative bg-black text-white rounded-full w-fit z-[99]"
            >
              Let's talk!
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
};
