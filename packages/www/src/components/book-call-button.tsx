"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import posthog from "posthog-js";
export default function BookACall({
  userImage = "/noah.jpg",
  userName = "User",
}: {
  userImage?: string;
  userName?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      className="group flex items-center  px-4 py-2 h-auto text-base transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      asChild
    >
      <Link
        onClick={() => {
          posthog.capture("book-call-button-clicked", {
            property: "button",
          });
        }}
        href="https://cal.com/noahchonlee/15min"
      >
        <div className="flex items-center  overflow-hidden">
          <Avatar className="size-7 border border-border flex-shrink-0 z-[2]">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{userName[0]}</AvatarFallback>
          </Avatar>
          <motion.div
            className="flex items-center justify-center  rounded-full  text-xs font-bold flex-shrink-0"
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: isHovered ? 20 : 0,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <span>+</span>
          </motion.div>
          <motion.div
            className="flex items-center justify-center bg-card text-card-foreground rounded-full size-7 text-[8px] font-bold flex-shrink-0"
            initial={{ width: 0, x: -40, opacity: 0 }}
            animate={{
              width: isHovered ? 30 : 0,
              x: isHovered ? 0 : -40,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              width: { duration: 0.2 },
            }}
          >
            <span>you</span>
          </motion.div>
        </div>
        <span className="font-semibold whitespace-nowrap">
          Book a 15 min call
        </span>
      </Link>
    </Button>
  );
}
