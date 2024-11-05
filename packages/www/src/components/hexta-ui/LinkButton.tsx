import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top" | string;
  variant?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "fail"
    | "ghost"
    | "link";
  outline?: boolean;
  animated?: boolean;
}

export const LinkButton = ({
  children,
  href,
  className,
  target,
  variant = "primary",
  outline = false,
  animated = false,
  ...rest
}: ButtonProps) => {
  const baseClasses = twMerge(
    "px-[20px] py-[8px] rounded-lg flex items-center font-[600] text-[14px] transition-all duration-[0.1s] hover:brightness-90"
  );

  const variantClasses = clsx({
    "bg-white border border-zinc-900 text-black": variant === "primary",
    "bg-zinc-950 border border-zinc-900 text-white": variant === "secondary",
    "bg-blue-400 border border-blue-900 text-black": variant === "info",
    "bg-green-400 border border-green-900 text-black": variant === "success",
    "bg-red-700 border border-red-900 text-white": variant === "fail",
    "text-white hover:bg-zinc-950": variant === "ghost",
    "text-white hover:underline underline-offset-1": variant === "link",
  });

  const outlineClasses = outline
    ? twMerge("bg-transparent border border-zinc-100 text-white")
    : "";
  const animatedClasses = animated
    ? twMerge("transition-all duration-[0.2s] hover:scale-105")
    : "";

  const classes = twMerge(
    baseClasses,
    variantClasses,
    outlineClasses,
    animatedClasses,
    className
  );

  return (
    <Link href={`${href}`} className={classes} {...rest}>
      {children}
    </Link>
  );
};

export default LinkButton;
