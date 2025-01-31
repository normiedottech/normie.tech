"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Company {
  name: string;
  logo: string;
}

interface LogoMarqueeProps {
  companies: Company[];
  speed?: number;
}

export function LogoMarquee({ companies, speed = 30 }: LogoMarqueeProps) {
  const marqueeStyle: React.CSSProperties = {
    display: "flex",
    overflow: "hidden",
    whiteSpace: "nowrap",
  };

  const marqueeContentStyle: React.CSSProperties = {
    display: "flex",
    animation: `marquee ${speed}s linear infinite`,
    paddingRight: "50px", // Add some space between the end and the beginning of the marquee
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginRight: "50px",
  };

  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden my-16">
      <div style={marqueeStyle}>
        <div  style={marqueeContentStyle}>
          {[...companies, ...companies].map((company, index) => (
            <div key={index} style={logoStyle} className={`p-8 flex items-center ${
              company.name === "Grassroots Economics" ? "w-[350px]" : "w-auto"
            }`}>
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="h-12 w-auto mr-3"
              />
              <span className="text-lg font-semibold">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
