"use client";

import { API_URL } from '@/lib/constants';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { env } from '../../../env';

interface CheckoutPaymentProps {
  transactionId: string;
  amount: number;
  description?: string;
  orderId: string;
  successUrl?: string;
}

export function CheckoutPayment({ transactionId, amount, description, orderId, successUrl }: CheckoutPaymentProps) {
  const router = useRouter();

  console.log("successUrl", successUrl)
  return (
    <div className="bg-white text-foreground rounded-lg p-4 mt-4">
      <PayPalScriptProvider options={{
        disableFunding:"paylater",
        clientId:env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components:"card-fields,buttons"
  
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

          createOrder={async () => {
           
            return orderId;
          }}
          onApprove={async (data) => {
            await fetch(`${API_URL}/v1/payment/3/capture`, {
              method: 'POST',
              body: JSON.stringify({
                orderID: data.orderID,
                transactionId: transactionId
              })
            });
            if(successUrl) {
              window.location.href = successUrl;

            }
            else{
              router.push(`/checkout/success?transactionId=${transactionId}`);
            }

            
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}