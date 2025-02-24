"use client";

import { API_URL } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { env } from '../../../env';
import { Loader2 } from 'lucide-react';

// Dynamically import PayPal components
const PayPalScriptProvider = dynamic(
  () => import('@paypal/react-paypal-js').then(mod => mod.PayPalScriptProvider),
  { ssr: false }
);

const PayPalButtons = dynamic(
  () => import('@paypal/react-paypal-js').then(mod => mod.PayPalButtons),
  { ssr: false }
);

interface CheckoutPaymentProps {
  transactionId: string;
  amount: number;
  description?: string;
  orderId: string;
  successUrl?: string;
  projectId: string;
}

export function CheckoutPayment({ projectId,transactionId, amount, description, orderId, successUrl }: CheckoutPaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true)
  console.log(env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,"client id")
  return (
    <div className="bg-background text-foreground rounded-lg p-4 mt-4 border relative min-h-[150px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      <PayPalScriptProvider options={{
        disableFunding: "paylater",
        clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components: projectId  === "voice-deck"? "card-fields,buttons" : undefined,
      }}>
        <PayPalButtons 
          style={{
            layout: "vertical",
            color: "gold",
            height: 48,
            label: "checkout",
            shape: "rect",
            tagline: false,
          }}
          onInit={() => {
            setIsLoading(false);
          }}
          onError={(err) => {
            console.error('PayPal Error:', err);
            toast.error('Failed to load payment system. Please try again later.');
            setIsLoading(false);
          }}
          createOrder={async () => {
            try {
              return orderId;
            } catch (error) {
              toast.error('Failed to create order. Please try again.');
              throw error;
            }
          }}
          onApprove={async (data) => {
            try {
              setIsLoading(true);
              await fetch(`${API_URL}/v1/payment/3/capture`, {
                method: 'POST',
                body: JSON.stringify({
                  orderID: data.orderID,
                  transactionId: transactionId
                })
              });
              
              if(successUrl) {
                window.location.href = successUrl;
              } else {
                router.push(`/checkout/success?transactionId=${transactionId}`);
              }
            } catch (error) {
              toast.error('Payment failed. Please try again.');
              setIsLoading(false);
            }
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}