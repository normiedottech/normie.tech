"use client";
import { getColorModeFromProject } from "@/actions/product"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import { IconArticleFilled } from "@tabler/icons-react";
import { Copy, Menu, X } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AryanHeader({
	session,
	projectId,
}: {
	session: Session | null | undefined;
	projectId: string;
}) {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const disableMenu =
		typeof window !== "undefined"
			? window.location.pathname.includes("/checkout")
			: false;

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	return (
		<nav className="fixed top-0 left-0 right-0 mb-10 z-50 backdrop-blur-sm">
			<div className="max-w-8xl px-6">
				<div className="flex justify-between items-center py-4">
					<div className="flex justify-start lg:w-0 lg:flex-1">
						<Link href="/">
							<div className="flex items-center gap-2">
								<Image
									src="/NormieLogo.png"
									alt="Normie Tech Logo"
									width={180}
									height={50}
									className="h-8 w-auto bg-[#00B67A]/35 rounded-xl"
								/>
								<h1>NORMIE TECH</h1>
							</div>
						</Link>
					</div>

					{!disableMenu && (
						<Link href="https://normietech.substack.com">
							<Button>
								<IconArticleFilled />
								Read our blog
							</Button>
						</Link>
					)}

					{/* Show login button when not logged in */}
					{!session && !disableMenu && (
						<div className="flex items-center gap-4">
							<Link href="/dashboard/sign-in" className="ml-2">
								<Button className="">Login</Button>
							</Link>
						</div>
					)}

					{session && !disableMenu && (
						<div className="hidden md:flex items-center gap-4">
							{renderMenuItems()}
						</div>
					)}

					{/* Mobile menu button - only show if logged in */}
					{session && !disableMenu && (
						<div className="md:hidden flex items-center">
							<button
								onClick={toggleMenu}
								className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
							>
								{isMenuOpen ? <X /> : <Menu />}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Mobile menu, show/hide based on menu state */}
			{session && isMenuOpen && !disableMenu && (
				<div className="md:hidden">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
						{renderMenuItems()}
					</div>
				</div>
			)}
		</nav>
	);

	function renderMenuItems() {
		if (!session) return null;
		return (
			<>
				{pathname !== "/dashboard" && !disableMenu && (
					<Link href="/dashboard" className="w-full md:w-auto ml-2">
						<Button className="w-full md:w-auto bg-[#00B67A] text-white hover:bg-[#009966]">
							Dashboard
						</Button>
					</Link>
				)}
				<Button
					onClick={() => signOut()}
					className="w-full md:w-auto bg-red-500 text-white hover:bg-red-600 ml-2"
				>
					Logout
				</Button>
			</>
		);
	}
}
