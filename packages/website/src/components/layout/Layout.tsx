import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import GridPattern from "../grid-pattern";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
     
      <main>{children}</main>
      <Footer />
    </>
  );
};
