"use server";

import { formSchema } from "@/lib/utils";
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
// https://docs.google.com/forms/u/5/d/e/1FAIpQLSeY7rFOlChb_X-k4gdh_HAHqYsFFqwTu4kQw-5cChd_j35SBw/formResponse?entry.290581227=${values.name}&entry.506907225=${values.email}&entry.399888343=${values.message}