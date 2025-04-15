"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { handleReportSubmit } from "@/actions/contact";
import { reportFormSchema } from "@/lib/utils";



export default function ReportIssuePage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      email: "",
      errorMessage: "",
    },
  });

  const onSubmitForm = async (values: z.infer<typeof reportFormSchema>) => {
    try {
      setIsLoading(true);
      console.log('Report form values:', values);
      
      toast.promise(handleReportSubmit(values), {
        loading: "Submitting report...",
        success: "Report submitted successfully",
        error: "Failed to submit report",
      });

      form.reset();
    } catch (error) {
      console.error('Report submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-background">
      <div className="mx-auto max-w-2xl my-11">
        <Card className="overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg">
          <div className="flex flex-col p-6">
            <div className="flex items-center mb-6">
              <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mr-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <h1 className="text-2xl font-bold">Report Payment Issue</h1>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email address"
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <FormField
                  control={form.control}
                  name="errorMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What error message are you getting?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe the error message or issue you're experiencing..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  Submit Report
                </Button>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}