"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CoolDollarSign from "../components/cool-dollar-sign";
import { getProductCheckoutLink } from "@/actions/product";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function PaymentPage({
  name,
  productId,
  projectId,
  fixedAmount,
}: {
  productId: string;
  name: string;
  projectId: string;
  fixedAmount?: number | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    fixedAmount ? fixedAmount.toString() : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await getProductCheckoutLink({
        productId: productId,
        projectId: projectId,
        amount: parseFloat(amount),
      });
      console.log({ response });
      if (response.success) {
        router.push(response.res);
      } else {
        setError(response.error ?? "Error");
      }
    } catch (err) {
      setError(
        "An error occurred while processing your payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  console.log({ fixedAmount });
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative">
        <div className="text-center">
          <CoolDollarSign />
          <h2 className="mt-6 text-center text-3xl font-extrabold ">{name}</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <label htmlFor="amount" className="sr-only">
                Amount in USD
              </label>
              {fixedAmount ? (
                <div className="text-center text-2xl font-bold">
                  Pay ${fixedAmount}
                </div>
              ) : (
                <>
                  <Input
                    id="amount"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    pattern="\d*\.?\d{0,2}"
                    required
                    className={`rounded-none relative block w-full px-3 py-2 border rounded-t-md focus:outline-none focus:z-10 sm:text-sm ${
                      isAmountFocused ? "animate-pulse" : ""
                    }`}
                    placeholder="Enter amount in USD"
                    value={amount}
                    onChange={handleAmountChange}
                    onFocus={() => setIsAmountFocused(true)}
                    onBlur={() => setIsAmountFocused(false)}
                  />
                  <span
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none transition-all duration-300 ${
                      isAmountFocused ? " scale-110" : "text-gray-400"
                    }`}
                  >
                    $
                  </span>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2 animate-shake">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              {isLoading ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

