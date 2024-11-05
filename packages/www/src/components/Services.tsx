"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Project {
  title: string;
  src: string;
  color: string;
}

const projects: Project[] = [
  {
    title: "FIAT PAYMENTS",
    src: "fiat-payments.jpeg",
    color: "#000000",
  },
  {
    title: "WEB2 LOGIN",
    src: "web2-login.jpeg",
    color: "#8C8C8C",
  },
  {
    title: "GASLESS TRANSACTIONS",
    src: "gasless.jpeg",
    color: "#EFE8D3",
  },
];

const scaleAnimation = {
  initial: { scale: 0, x: "-50%", y: "-50%" },
  enter: {
    scale: 1,
    x: "-50%",
    y: "-50%",
    transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] },
  },
  closed: {
    scale: 0,
    x: "-50%",
    y: "-50%",
    transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] },
  },
};

export const Services = () => {
  const [modal, setModal] = useState<{ active: boolean; index: number }>({
    active: false,
    index: 0,
  });
  const { active, index } = modal;
  const modalContainer = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const cursorLabel = useRef<HTMLDivElement>(null);

  let xMoveContainer = useRef<gsap.QuickToFunc | null>(null);
  let yMoveContainer = useRef<gsap.QuickToFunc | null>(null);
  let xMoveCursor = useRef<gsap.QuickToFunc | null>(null);
  let yMoveCursor = useRef<gsap.QuickToFunc | null>(null);
  let xMoveCursorLabel = useRef<gsap.QuickToFunc | null>(null);
  let yMoveCursorLabel = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    xMoveContainer.current = gsap.quickTo(modalContainer.current!, "left", {
      duration: 0.8,
      ease: "power3",
    });
    yMoveContainer.current = gsap.quickTo(modalContainer.current!, "top", {
      duration: 0.8,
      ease: "power3",
    });
    xMoveCursor.current = gsap.quickTo(cursor.current!, "left", {
      duration: 0.5,
      ease: "power3",
    });
    yMoveCursor.current = gsap.quickTo(cursor.current!, "top", {
      duration: 0.5,
      ease: "power3",
    });
    xMoveCursorLabel.current = gsap.quickTo(cursorLabel.current!, "left", {
      duration: 0.45,
      ease: "power3",
    });
    yMoveCursorLabel.current = gsap.quickTo(cursorLabel.current!, "top", {
      duration: 0.45,
      ease: "power3",
    });
  }, []);

  const moveItems = (x: number, y: number) => {
    xMoveContainer.current?.(x);
    yMoveContainer.current?.(y);
    xMoveCursor.current?.(x);
    yMoveCursor.current?.(y);
    xMoveCursorLabel.current?.(x);
    yMoveCursorLabel.current?.(y);
  };

  const manageModal = (
    active: boolean,
    index: number,
    x: number,
    y: number
  ) => {
    moveItems(x, y);
    setModal({ active, index });
  };

  return (
    <section
      id="Services"
      onMouseMove={(e) => moveItems(e.clientX, e.clientY)}
      className="flex items-center justify-start flex-col mx-auto gap-6 overflow-hidden mb-[8rem]"
    >
      <h2 
      className="text-5xl font-bold bricolage-fonts"
      >
        We can help you with <span className="animate-ping">.</span>
        <span
          className="animate-ping"
          style={{
            animationDelay: "0.2s",
          }}
        >
          .
        </span>
        <span
          className="animate-ping"
          style={{
            animationDelay: "0.4s",
          }}
        >
          .
        </span>
      </h2>
      <div className="w-full max-w-7xl flex flex-col items-center justify-center mb-16">
        {projects.map((project, index) => (
          <ProjectItem
            key={index}
            index={index}
            title={project.title}
            manageModal={manageModal}
          />
        ))}
      </div>
      <motion.div
        ref={modalContainer}
        variants={scaleAnimation}
        initial="initial"
        animate={active ? "enter" : "closed"}
        className="h-[350px] w-[400px] bg-white pointer-events-none overflow-hidden z-30 fixed left-0 top-0"
      >
        <div
          style={{ top: index * -100 + "%" }}
          className="h-full w-full relative transition-top duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
        >
          {projects.map((project, i) => (
            <div
              key={`modal_${i}`}
              className="h-full w-full flex items-center justify-center"
              style={{ backgroundColor: project.color }}
            >
              <Image
                src={`/${project.src}`}
                width={300}
                height={0}
                alt={project.title}
                className="h-auto"
              />
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        ref={cursor}
        variants={scaleAnimation}
        initial="initial"
        animate={active ? "enter" : "closed"}
        className="w-20 h-20 rounded-full bg-primary text-primary-foreground fixed z-30 flex items-center justify-center text-sm font-light pointer-events-none"
      ></motion.div>
      <motion.div
        ref={cursorLabel}
        variants={scaleAnimation}
        initial="initial"
        animate={active ? "enter" : "closed"}
        className="w-20 h-20 rounded-full fixed z-[100] flex items-center justify-center text-sm font-light pointer-events-none top-0 left-0"
      >
        View
      </motion.div>
    </section>
  );
};

interface ProjectItemProps {
  index: number;
  title: string;
  manageModal: (active: boolean, index: number, x: number, y: number) => void;
}

function ProjectItem({ index, title, manageModal }: ProjectItemProps) {
  return (
    <div
      onMouseEnter={(e) => {
        manageModal(true, index, e.clientX, e.clientY);
      }}
      onMouseLeave={(e) => {
        manageModal(false, index, e.clientX, e.clientY);
      }}
      className="flex w-full items-center justify-between py-10 px-4 border-b border-neutral-300 cursor-pointer group transition-all duration-300 ease-in-out hover:px-8"
    >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-transform duration-300 ease-in-out group-hover:translate-x-4 relative">
        {title}
      </h2>
      <div className="pr-7 ">
        <svg
          fill="none"
          height="30"
          viewBox="0 0 80 44"
          width="80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M0 20.527v2.602h73.138a21.408 21.408 0 0 0-8.283 5.145 21.42 21.42 0 0 0-6.274 15.145h2.698A18.72 18.72 0 0 1 80 24.699v-5.397A18.72 18.72 0 0 1 61.28.582H58.58a21.419 21.419 0 0 0 13.614 19.945H0ZM79.784 22v.002a22.992 22.992 0 0 1 0-.002Z"
            fill="currentColor"
            fillRule="evenodd"
          ></path>
        </svg>
      </div>
    </div>
  );
}
