"use server";

import { formSchema, reportFormSchema } from "@/lib/utils";
import type { z } from "zod";

export const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    const res = await fetch(`
       https://docs.google.com/forms/d/e/1FAIpQLSeY7rFOlChb_X-k4gdh_HAHqYsFFqwTu4kQw-5cChd_j35SBw/formResponse?entry.290581227=${values.name}&entry.506907225=${values.email}&entry.399888343=${values.message}&entry.395368330=${values.country}&entry.832578858=${values.volume}&entry.1060663873=${values.industry}
   `);
   
    console.log(res);
  } catch (err) {
    console.log(err);
  }
};

export const handleReportSubmit = async (values: z.infer<typeof reportFormSchema>) => {
  try {
    // Replace this URL with your actual Google Form URL
    const res = await fetch(`
      https://docs.google.com/forms/d/e/1FAIpQLSfc7t2CmYb9ddDdeRH2-yZcJtD8bq-zbsq4lCf7Q0u7WAtLZw/formResponse?entry.1989876129=${values.email}&entry.1418854308=${values.errorMessage}
    `);
    
    console.log('Form submission response:', res);
    return { success: true };
  } catch (err) {
    console.error('Error submitting form:', err);
    throw new Error('Failed to submit the report');
  }
};
// https://docs.google.com/forms/u/5/d/e/1FAIpQLSeY7rFOlChb_X-k4gdh_HAHqYsFFqwTu4kQw-5cChd_j35SBw/formResponse?entry.290581227=${values.name}&entry.506907225=${values.email}&entry.399888343=${values.message}