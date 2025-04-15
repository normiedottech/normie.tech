import React from "react";
import GridPattern from "../grid-pattern";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			<Navbar />

			<main>{children}</main>
			<Footer />
		</>
	);
};
