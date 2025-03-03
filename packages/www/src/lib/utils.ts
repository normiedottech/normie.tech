import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  message: z.string().min(1, 'Message is required.'),
  country: z.string().min(1, 'Country is required.'),
  volume: z.string().min(1, 'Expected monthly volume is required.'),
  industry: z.string().min(1, 'Industry is required.'),
})
