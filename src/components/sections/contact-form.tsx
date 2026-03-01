"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Section } from "./section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormErrors {
  fullName?: string;
  email?: string;
  school?: string;
  undergraduateYear?: string;
  message?: string;
  form?: string;
}

// Throttle key and duration
const THROTTLE_KEY = "qf_contact_last_submit";
const THROTTLE_DURATION_MS = 5000; // 5 seconds between submissions

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form load timestamp for anti-spam
  const [formLoadedAt] = useState(() => Date.now());

  // Year dropdown options (2020-2032)
  const yearOptions = Array.from({ length: 13 }, (_, i) => 2020 + i);

  // Check client-side throttle
  function isThrottled(): boolean {
    try {
      const lastSubmit = localStorage.getItem(THROTTLE_KEY);
      if (lastSubmit) {
        const elapsed = Date.now() - parseInt(lastSubmit, 10);
        return elapsed < THROTTLE_DURATION_MS;
      }
    } catch {
      // localStorage not available
    }
    return false;
  }

  // Set throttle timestamp
  function setThrottle() {
    try {
      localStorage.setItem(THROTTLE_KEY, Date.now().toString());
    } catch {
      // localStorage not available
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side throttle check
    if (isThrottled()) {
      setErrors({ form: "Please wait a few seconds before submitting again." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const newErrors: FormErrors = {};
    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const school = (formData.get("school") as string)?.trim();

    if (!fullName || fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!school || school.length < 2) {
      newErrors.school = "Please enter your school name";
    }
    const yearValue = formData.get("undergraduateYear") as string;
    const year = parseInt(yearValue);
    if (!yearValue || isNaN(year) || year < 2020 || year > 2032) {
      newErrors.undergraduateYear = "Please select your undergraduate year";
    }
    const message = (formData.get("message") as string)?.trim();
    if (!message || message.length < 2) {
      newErrors.message = "Please enter your comments or questions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          school,
          undergraduateYear: year,
          message: (formData.get("message") as string)?.trim() || undefined,
          // Anti-spam fields
          hp_website: (formData.get("hp_website") as string) || "",
          _ts: formLoadedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrors({
            form: "Too many submissions. Please try again in a few minutes.",
          });
        } else if (data.code === "too_fast") {
          setErrors({
            form: "Please take a moment to fill out the form completely.",
          });
        } else if (data.code === "disposable_email") {
          setErrors({
            email: "Please use a permanent email address.",
          });
        } else if (data.details?.fieldErrors) {
          const fieldErrors = data.details.fieldErrors;
          setErrors({
            fullName: fieldErrors.fullName?.[0],
            email: fieldErrors.email?.[0],
            school: fieldErrors.school?.[0],
            undergraduateYear: fieldErrors.undergraduateYear?.[0],
            message: fieldErrors.message?.[0],
          });
        } else {
          setErrors({
            form: data.error || "Something went wrong. Please try again.",
          });
        }
        return;
      }

      // Set throttle on successful submission
      setThrottle();
      setIsSuccess(true);
    } catch {
      setErrors({
        form: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <Section>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">
              Thank you for reaching out!
            </h3>
            <p className="text-muted-foreground">
              We&apos;ll get back to you within 24-48 hours.
            </p>
          </CardContent>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl md:text-3xl font-serif">
            Contact Us
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Have questions about our mentorship program? We&apos;d love to hear
            from you.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - hidden from users, bots will fill it */}
            <input
              type="text"
              name="hp_website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            />

            {/* Row 1: Full Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={
                    errors.fullName ? "fullName-error" : undefined
                  }
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: School + Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">
                  School <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="school"
                  name="school"
                  placeholder="Enter your school name"
                  aria-invalid={!!errors.school}
                  aria-describedby={errors.school ? "school-error" : undefined}
                />
                {errors.school && (
                  <p id="school-error" className="text-sm text-destructive">
                    {errors.school}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="undergraduateYear">
                  Undergraduate Year <span className="text-destructive">*</span>
                </Label>
                <Select name="undergraduateYear">
                  <SelectTrigger
                    id="undergraduateYear"
                    aria-invalid={!!errors.undergraduateYear}
                    aria-describedby={
                      errors.undergraduateYear ? "year-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.undergraduateYear && (
                  <p id="year-error" className="text-sm text-destructive">
                    {errors.undergraduateYear}
                  </p>
                )}
              </div>
            </div>

            {/* Comments/Questions - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Comments or Questions{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Tell us about your interest in quantitative finance, any specific questions you have, or how we can help you..."
                className="resize-y min-h-[120px]"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              {errors.message && (
                <p id="message-error" className="text-sm text-destructive">
                  {errors.message}
                </p>
              )}
            </div>

            {/* Form-level error */}
            {errors.form && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{errors.form}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Section>
  );
}
