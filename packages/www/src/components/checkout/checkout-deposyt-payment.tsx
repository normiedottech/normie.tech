"use client"
import { useEffect, useState } from 'react';

declare global {
    interface Window {
        CollectJS: {
            configure: (config: any) => void;
        };
    }
}

export function CheckoutDeposytPayment() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load Collect.js script
        const script = document.createElement('script');
        script.src = 'https://deposyt.transactiongateway.com/token/Collect.js';
        script.setAttribute('data-tokenization-key', 'jY2U4f-vmX7d8-5eGe44-H49h2d');
        script.onload = () => {
            setIsLoading(false);
            configureCollectJs();
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script when component unmounts
            document.head.removeChild(script);
        };
    }, []);

    const configureCollectJs = () => {
        console.log('Configuring Collect.js');
        console.log(window.CollectJS);
        window.CollectJS.configure({
            variant: 'lightbox',
            callback: (response: any) => {
                // Handle the payment token
                console.log('Payment token:', response.token);
                // Here you would typically send the token to your server
                handlePaymentToken(response.token);
            },
            fields: {
                ccnumber: {
                    placeholder: 'Card Number',
                    selector: '#ccnumber'
                },
                ccexp: {
                    placeholder: 'MM/YY',
                    selector: '#ccexp'
                },
                cvv: {
                    placeholder: 'CVV',
                    selector: '#cvv'
                }
            },
            
            
            paymentSelector: '#payButton', // The button that triggers the lightbox
         
            buttonText: 'Pay Now',
            theme: 'bootstrap', // or 'basic'

        });
    };

    const handlePaymentToken = async (token: string) => {
        // Send the token along with other form data to your server
        try {
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentToken: token,
                    firstName: document.getElementById('first_name')?.value,
                    lastName: document.getElementById('last_name')?.value,
                }),
            });
            const data = await response.json();
            // Handle the response
            if (data.success) {
                // Show success message or redirect
            }
        } catch (error) {
            console.error('Payment processing error:', error);
        }
    };

    if (isLoading) {
        return <div>Loading payment form...</div>;
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <form className="space-y-4">
                {/* Personal Information */}
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium">
                        First Name
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium">
                        Last Name
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    />
                </div>

                {/* Payment Button - Clicking this will trigger the lightbox */}
                <button
                    id="payButton"
                    type="button"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Proceed to Payment
                </button>
            </form>
        </div>
    );
}