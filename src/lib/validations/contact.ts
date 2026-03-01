// Validation schemas for contact form
import { z } from "zod";

// Core form data schema (visible fields)
export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  school: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(200, "School name must be less than 200 characters"),
  undergraduateYear: z
    .number()
    .int("Year must be a whole number")
    .min(2020, "Year must be 2020 or later")
    .max(2032, "Year must be 2032 or earlier"),
  message: z
    .string()
    .max(5000, "Message must be less than 5000 characters")
    .optional(),
});

// Extended schema with anti-spam fields
export const contactSubmissionSchema = contactFormSchema.extend({
  // Honeypot field - should be empty
  hp_website: z.string().max(0).optional(),
  // Timestamp when form was rendered (for timing check)
  _ts: z.number().optional(),
  // reCAPTCHA token
  _captchaToken: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
