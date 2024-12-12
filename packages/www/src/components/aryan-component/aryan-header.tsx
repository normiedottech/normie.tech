"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Copy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Session } from "next-auth";

export default function AryanHeader({
  session,
  projectId,
  payoutAddress,
}: {
  session: Session | null | undefined;
  projectId: string;
  payoutAddress?: string | null;
}) {
  const pathname = usePathname();
  const [copySuccess, setCopySuccess] = useState("");
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
  const handleCopyPayoutAddress = async () => {
    if(!payoutAddress) return;
    try {
      await navigator.clipboard.writeText(payoutAddress);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (error) {
      console.error("Failed to copy Payout Address:", error);
      setCopySuccess("Failed to copy");
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
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
                    className="h-10 w-auto bg-[#00B67A]/35 rounded-xl"
                  />
                  <h1 className="text-xl font-bold">NORMIE TECH</h1>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {!session ? (
                pathname !== "/dashboard/sign-in" && (
                  <Link href="/dashboard/sign-in">
                    <Button className="bg-[#00B67A] text-white hover:bg-[#009966]">
                      Login
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <div className="flex items-center space-x-2 z-50">
                    {payoutAddress && (
                      <>
                        <span className="font-medium">Payout Address:</span>
                        <span>{truncateAddress(payoutAddress)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPayoutAddress}
                        >
                          <Copy className="w-4 h-4" />
                          <span className="sr-only">Copy payout address</span>
                        </Button>
                        {copySuccess && (
                          <span className="text-sm text-green-500">
                            {copySuccess}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="font-medium">Project ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono py-1 rounded">
                        {projectId}
                      </span>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-1" />
                      </Button>
                    </div>
                  </div>
                  {pathname !== "/dashboard" && (
                    <Link href="/dashboard">
                      <Button className="bg-[#00B67A] text-white hover:bg-[#009966]">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button variant="destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
