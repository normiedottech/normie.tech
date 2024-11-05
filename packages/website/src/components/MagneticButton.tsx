import { useEffect, useRef } from "react";
import gsap from "gsap";
import React from "react";

export const MagneticButton = ({ children }: { children: React.ReactNode }) => {
  const magnetic = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const xTo = gsap.quickTo(magnetic?.current, "x", {
      ease: "expo",
      duration: 1,
    });

    const yTo = gsap.quickTo(magnetic?.current, "y", {
      ease: "expo",
      duration: 1,
    });

    const mouseMove = (e: { clientX: any; clientY: any }) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } =
        magnetic?.current?.getBoundingClientRect() || {
          height: 0,
          width: 0,
          left: 0,
          top: 0,
        };
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);

      xTo(x);
      yTo(y);
    };

    const mouseLeave = () => {
      gsap.to(magnetic?.current, { x: 0 });
      gsap.to(magnetic?.current, { y: 0 });

      xTo(0);
      yTo(0);
    };

    magnetic.current?.addEventListener("mousemove", mouseMove);
    magnetic.current?.addEventListener("mouseleave", mouseLeave);

    return () => {
      magnetic.current?.removeEventListener("mousemove", mouseMove);
      magnetic.current?.removeEventListener("mouseleave", mouseLeave);
    };
  }, []);

  return children
    ? React.cloneElement(children as React.ReactElement<any>, { ref: magnetic })
    : null;
};
