"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Copy, Menu, X } from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Session } from "next-auth";

export default function AryanHeader({
  session,
  projectId
}: {
  session: Session | null | undefined;
  projectId: string;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut();
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      alert("Project ID copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy Project ID:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 mb-10 z-50 bg-gradient from-black via-gray-900 to-black bg-opacity-90 backdrop-blur-sm">
      <div className="max-w-8xl px-4">
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
                <h1 className="text-lg font-bold hidden sm:block">NORMIE TECH</h1>
              </div>
            </Link>
          </div>
          
          {/* Login button (always visible) */}
          {!session && pathname !== "/dashboard/sign-in" && (
            // <Link href="/dashboard/sign-in" className="mr-2 md:mr-0">
            //   <Button className="bg-[#00B67A] text-white hover:bg-[#009966]">
            //     Log in / Sign up
            //   </Button>
            // </Link>
            <></>
          )}

          {/* Mobile menu button (only for logged-in users) */}
          {session && (
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}

          {/* Desktop menu (for logged-in users) */}
          {session && (
            <div className="hidden md:flex items-center gap-4">
              {renderMenuItems()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu (for logged-in users) */}
      {session && isMenuOpen && (
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
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-2 md:mb-0">
          <span className="font-medium">Project ID:</span>
          <div className="flex items-center space-x-2">
            <span className="font-mono py-1 rounded text-sm">
              {projectId}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {pathname !== "/dashboard" && (
          <Link href="/dashboard" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-[#00B67A] text-white hover:bg-[#009966]">
              Dashboard
            </Button>
          </Link>
        )}
        <Button variant="destructive" onClick={handleLogout} className="w-full md:w-auto">
          Logout
        </Button>
      </>
    );
  }
}

