"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpeedometerStat from "./stats";
import { LogoMarquee } from "./logo-marque";
import Image from "next/image";

interface Company {
  name: string;
  logo: string;
}

interface Stat {
  value: number;
  label: string;
  max: number;
}

interface PlatformOverviewProps {
  companies: Company[];
  stats: Stat[];
}

export default function PlatformOverview({
  companies,
  stats,
}: PlatformOverviewProps) {
  return (
    <div className="space-y-8 max-w-4xl  mx-auto p-4 pb-40 ">
      {/* <Card className=" border-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            {stats.map((stat, index) => (
              <SpeedometerStat key={index} {...stat} />
            ))}
          </div>
        </CardContent>
      </Card> */}
      {/* <h2 className="text-2xl font-bold text-center">How it works</h2>
      <Image
        src="/how-it-works.svg"
        alt="how it works"
        width={1000}
        height={1000}
      /> */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Our Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <LogoMarquee companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
