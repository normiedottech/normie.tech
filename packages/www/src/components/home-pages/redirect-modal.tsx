'use client';
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RedirectModal({ isOpen, onClose }: RedirectModalProps) {
  const [countdown, setCountdown] = useState(10);
  const redirectUrl = "https://sandbox.normie.tech";

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && countdown === 0) {
      window.location.href = redirectUrl;
    }
    
    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  const handleRedirectNow = () => {
    window.location.href = redirectUrl;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-[#00B67A]/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Redirect to Sandbox</DialogTitle>
          <DialogDescription className="text-gray-300">
            You are being redirected to <span className="text-[#00B67A] font-medium">{redirectUrl}</span> to test transactions and see how our payment solution works.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#00B67A]/10 border-4 border-[#00B67A]/20 flex items-center justify-center text-2xl font-bold text-[#00B67A]">
              {countdown}
            </div>
          </div>
          <p className="text-center text-gray-300">
            Redirecting in {countdown} seconds...
          </p>
          <div className="flex justify-between gap-3 mt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border-gray-700 hover:bg-gray-800 text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRedirectNow} 
              className="bg-[#00B67A] hover:bg-[#009966] text-white"
            >
              Go Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}