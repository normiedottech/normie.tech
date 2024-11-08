"use server";

import { formSchema } from "@/lib/utils";
import type { z } from "zod";

export const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    const res = await fetch(`
    https://docs.google.com/forms/u/5/d/e/1FAIpQLSeY7rFOlChb_X-k4gdh_HAHqYsFFqwTu4kQw-5cChd_j35SBw/formResponse?entry.290581227=${values.name}&entry.506907225=${values.name}&entry.399888343=${values.message}`);
    console.log(res);
  } catch (err) {
    console.log(err);
  }
};
