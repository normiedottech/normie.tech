"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type * as z from "zod"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { handleFormSubmit } from "@/actions/contact"
import { formSchema, reportFormSchema } from "@/lib/utils"
import { handleReportSubmit } from "@/actions/contact"

export default function ReportIssuePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      email: "",
      errorMessage: "",
    },
  })

  const onSubmitForm = async (values: z.infer<typeof reportFormSchema>) => {
    try {
      setIsLoading(true)
      console.log("Report form values:", values)

      toast.promise(handleReportSubmit(values), {
        loading: "Submitting report...",
        success: () => {
          setShowSuccessModal(true)
          return "Report submitted successfully"
        },
        error: "Failed to submit report",
      })

      form.reset()
    } catch (error) {
      console.error("Report submission error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-background">
      <div className="mx-auto max-w-2xl my-11">
        <Card className="overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-lg">
          <div className="flex flex-col p-6">
           
            
              <h1 className="text-2xl font-bold mb-6">Report Payment Issue</h1>
          

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email address" type="email" {...field} />
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  Submit Report
                </Button>
              </form>
            </Form>
          </div>
        </Card>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="mb-2">Thank you for your report!</DialogTitle>
            <DialogDescription>
              We appreciate you taking the time to submit this payment issue. Our team will review your report and
              investigate the problem promptly.
            </DialogDescription>
          </DialogHeader>
          <DialogDescription className="py-4">
            We'll get back to you at the email address you provided as soon as we have more information or a resolution.
          </DialogDescription>
        
        </DialogContent>
      </Dialog>
    </div>
  )
}
