"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Copy, Menu, X } from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Session } from "next-auth";
import { IconArticleFilled } from "@tabler/icons-react";

export default function AryanHeader({
  session,
  projectId
}: {
  session: Session | null | undefined;
  projectId: string;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  
 

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 mb-10 z-50 bg-gradient from-black via-gray-900 to-black bg-opacity-90 backdrop-blur-sm">
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
                <h1 className="text-lg font-bold hidden sm:block">NORMIE TECH</h1>
              </div>
            </Link>
          </div>
          
          {/* Login button (always visible) */}
          {/* {!session && pathname !== "/dashboard/sign-in" && (
            <Link href="/dashboard/sign-in" className="mr-2 md:mr-0">
              <Button className="bg-[#00B67A] text-white hover:bg-[#009966]">
                Log in / Sign up
              </Button>
            </Link>
          )} */}

          <Link href="https://normietech.substack.com"> 
          <Button>
            <IconArticleFilled/>
            Read our blog
          </Button>
          </Link>

          {/* Mobile menu button (only for logged-in users) */}
          {/* {session && (
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )} */}

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
        
        {pathname !== "/dashboard" && (
          <Link href="/dashboard" className="w-full md:w-auto ml-2">
            <Button className="w-full md:w-auto bg-[#00B67A] text-white hover:bg-[#009966]">
              Dashboard
            </Button>
          </Link>
        )}
      
      </>
    );
  }
}

