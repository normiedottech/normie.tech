"use client"
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import CountrySelect from "@/components/ui/country-select";
import RegionSelect from "@/components/ui/region-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CountryData, PhoneInput, phoneSchema } from '../ui/phone-input';
import { env } from '../../../env';
import { API_URL } from '@/lib/constants';

// Define the form schema
const formSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional(),
    address1: z.string().min(1, "Street address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State/Province is required"),
    zip: z.string().min(1, "ZIP code is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    phone: phoneSchema.or(z.string().max(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CheckoutDeposytPayment({transactionId,finalTotalAmount,enable3DS}:{transactionId:string,finalTotalAmount:number,enable3DS:boolean  }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
   
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            address1: "",
            address2: "",
            city: "",
            country: "",
            state: "",
            zip: "",
            email: "",
            phone: "",
        },
    });
    console.log(form.getValues(),"form.getValues()");
    console.log(env.NEXT_PUBLIC_DEPOSYT_PUBLIC_KEY,"env.NEXT_PUBLIC_DEPOSYT_PUBLIC_KEY");
    useEffect(() => {
        const script = document.createElement('script');
        
        script.src = 'https://deposyt.transactiongateway.com/token/Collect.js';
       
        script.setAttribute('data-tokenization-key', env.NEXT_PUBLIC_DEPOSYT_PUBLIC_KEY);
        script.setAttribute('data-theme','material')
        script.setAttribute('data-payment-selector','#payButton')
        console.log(enable3DS,"enable3DS");
        if(enable3DS){
            console.log(enable3DS,"enable3DS");
            const script3DS = document.createElement('script');
            script3DS.src = 'https://deposyt.transactiongateway.com/token/Collect.js';
            script3DS.setAttribute('data-tokenization-key', env.NEXT_PUBLIC_DEPOSYT_PUBLIC_KEY);
            document.head.appendChild(script3DS);

            const scriptGateway = document.createElement('script');
            scriptGateway.src = "https://deposyt.transactiongateway.com/js/v1/Gateway.js";
            document.head.appendChild(scriptGateway);
           
        }

        script.onload = () => {
            setIsLoading(false);
            configureCollectJs();
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const configureCollectJs = () => {
        window.CollectJS.configure({
            variant: 'lightbox',
            price: finalTotalAmount.toFixed(2),
            paymentSelector: '#payButton',
          
            currency:'USD',
            callback: async (response: any) => {
                console.log({response});
                console.log(enable3DS,"enable3DS");

                if(enable3DS){
                    const gateway = window.Gateway.create(env.NEXT_PUBLIC_DEPOSYT_PUBLIC_CHECKOUT_KEY);
                    const threeDS = gateway.get3DSecure();

                    const options = {
                        paymentToken: response.token,
                        currency: 'USD',
                        amount: finalTotalAmount,
                        email: form.getValues("email"),
                        phone: form.getValues("phone"),
                        city:  form.getValues("city"),
                        state: form.getValues("state"),
                        address1: form.getValues("address1"),
                        address2: form.getValues("address2"),
                        country: form.getValues("country"),
                        firstName: form.getValues("first_name"),
                        lastName: form.getValues("last_name"),
                        postalCode:form.getValues("zip"),
                    };
                   const threeDSecureInterface = threeDS.createUI(options);
                   threeDSecureInterface.start('#threeDSMountPoint');

                   threeDSecureInterface.on('challenge', function(e:any) {
                       console.log('Challenged',{e});
                   });

                   threeDSecureInterface.on('complete', function(e:any) {
                       console.log({e},"complete");
                       handlePaymentToken(response.token);
                       
                   });

                   threeDSecureInterface.on('failure', function(e:any) {
                
                       console.log({e},"failure");
                   });
                }
                else {
                    setIsProcessing(true);
                    setError(null);
                    
                    const apiUrl = `${API_URL}/v1/payment/4/capture`;
                    
                    try {
                        const res = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                transactionId: transactionId,
                                paymentToken: response.token,
                                ...form.getValues(),
                            }),
                        });

                        if (!res.ok) {
                            
                            const errorData = await res.json();
                            throw new Error(errorData.error || 'Payment capture failed');
                        }

                        const data = await response.json();
                        console.log('Payment captured successfully:', data);
                        
                        // Show success message or redirect
                        
                    } catch (error) {
                        console.error('Payment capture error:', error);
                        setError(error instanceof Error ? error.message : 'Payment processing failed');
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
        });
    };

    const handlePaymentToken = async (token: string) => {
        try {
            const formData = {
                paymentToken: token,
                ...form.getValues(),
            };
            console.log({formData});
            await window.CollectJS.startPaymentRequest();
        } catch (error) {
            console.error('Payment processing error:', error);
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="p-6">
                    Loading payment form...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-4" autoComplete="on">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Personal Information */}
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="given-name"
                                                placeholder="First name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name (optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="family-name"
                                                placeholder="Last name (optional)"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Address Fields */}
                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Street Address *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="street-address"
                                                placeholder="Street address"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address2"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Apt, Suite, Building (optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="address-line2"
                                                placeholder="Apartment, suite, building (optional)"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="address-level2"
                                                placeholder="City"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country *</FormLabel>
                                        <FormControl>
                                            <CountrySelect
                                                placeholder="Select country"
                                                onChange={(country) => {
                                                    field.onChange(country);
                                                    
                                                    form.setValue("state", ""); // Reset state when country changes
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State/Province *</FormLabel>
                                        <FormControl>
                                            <RegionSelect
                                                countryCode={form.getValues("country")}
                                                onChange={(a)=>{
                                                    console.log(a,"a");
                                                    field.onChange(a);
                                                }}

                                                className="w-full"
                                                placeholder="Select state/province"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="zip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ZIP Code *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="postal-code"
                                                placeholder="ZIP code"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                autoComplete="email"
                                                placeholder="Email address"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone (optional)</FormLabel>
                                        <FormControl>
                                            <PhoneInput
                                                {...field}
                                                value={field.value}
                                                placeholder="Enter your number"

                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-6">
                            <Button
                                id="payButton"
                                type="button"
                                className="w-full"
                                size="lg"
                                onClick={()=>{
                                
                                    window.CollectJS.startPaymentRequest();
                                }}
                                disabled={!form.formState.isValid || isProcessing}
                            >
                                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                            </Button>
                            {error && (
                                <div className="mt-2 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}
                            <div id="threeDSMountPoint"></div>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}