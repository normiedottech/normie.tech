"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

import { formSchema } from "@/lib/utils";
import { handleFormSubmit } from "@/actions/contact";

export default function AryanContactSection() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmitForm =  (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      console.log('Form values:', values);
      
      toast.promise(handleFormSubmit(values), {
        loading: "Submitting...",
        success: "Submitted successfully",
        error: "Something went wrong",
      });

      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:space-x-8">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl ">
              Ready to revolutionize your fiat to crypto payments?
              <br />
              Let's talk!
            </p>
          </div>
          <div className="md:w-1/2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitForm)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          className="bg-gray-800 border-gray-700 text-white"
                          {...field}
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Your message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isLoading}
                  className="w-full  bg-[#00B67A] text-white hover:bg-[#009966]"
                  type="submit"
                >
                  Submit
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
