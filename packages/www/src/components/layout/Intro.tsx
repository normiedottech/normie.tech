"use client";

import gsap from "gsap";
import { useRef, useEffect, useState } from "react";

const Counter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = Date.now() + 2400;
    const interval = setInterval(() => {
      const timeLeft = Math.max(end - Date.now(), 0);
      const newCount = Math.floor((1 - timeLeft / 4000) * 100);
      setCount(newCount);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <p className="font-bold text-7xl bricolage-fonts z-[999999999]">{count}%</p>
  );
};

export default Counter;

export const Intro = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.to((containerRef.current as HTMLElement).children, {
        y: "-1000px",
        border: "1px solid rgb(82 82 91)",
        stagger: 0.2,
        duration: 1,
        delay: 2.7,
        ease: "circ.inOut",
      });
      gsap.to(containerRef.current, {
        display: "none",
        delay: 4,
      });
    }
  }, []);

  return (
    <>
      <div
        className="flex fixed  w-dvw h-dvh z-[999999999999]"
        ref={containerRef}
      >
        <div className="w-[20%] border-[0.5px] border-border bg-card h-dvh z-[99999999]"></div>
        <div className="w-[20%]  border-[0.5px] border-border bg-card h-dvh z-[99999999]"></div>
        <div className="w-[20%]  border-[0.5px] border-border bg-card h-dvh z-[99999999] flex items-center justify-center">
          <Counter />
        </div>
        <div className="w-[20%]  border-[0.5px] border-border bg-card h-dvh z-[9999999]"></div>
        <div className="w-[20%]  border-[0.5px] border-border bg-card h-dvh z-[9999999]"></div>
      </div>
    </>
  );
};
