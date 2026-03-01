// Contact form submission endpoint
// POST /api/contact - Public endpoint with multi-layer spam prevention

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { contactSubmissionSchema } from "@/lib/validations/contact";
import {
  contactLimiter,
  contactEmailLimiter,
  getClientIdentifier,
} from "@/lib/middleware/rate-limit";

// Minimum time (ms) between page load and submission to be considered legitimate
const MIN_SUBMISSION_TIME_MS = 3000;

// List of disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
  "getnada.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
]);

export async function POST(request: NextRequest) {
  const clientIp = getClientIdentifier(request.headers);

  try {
    const body = await request.json();

    // ========== LAYER 1: Honeypot Check ==========
    // If honeypot field is filled, silently accept but don't save
    if (body.hp_website && body.hp_website.length > 0) {
      console.log(`[Contact] Honeypot triggered from IP: ${clientIp}`);
      // Return fake success to not reveal the trap
      return NextResponse.json({ success: true, id: "blocked" });
    }

    // ========== LAYER 2: Timing Check ==========
    const submissionTime = body._ts ? Date.now() - body._ts : 0;
    if (body._ts && submissionTime < MIN_SUBMISSION_TIME_MS) {
      console.log(
        `[Contact] Too fast submission (${submissionTime}ms) from IP: ${clientIp}`,
      );
      // Soft block - ask for retry rather than outright error
      return NextResponse.json(
        {
          error: "Please take a moment to fill out the form completely.",
          code: "too_fast",
          requireCaptcha: true,
        },
        { status: 400 },
      );
    }

    // ========== LAYER 3: Zod Validation ==========
    const result = contactSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "validation_error",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = result.data;

    // ========== LAYER 4: Disposable Email Check ==========
    const emailDomain = data.email.split("@")[1]?.toLowerCase();
    if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
      console.log(
        `[Contact] Disposable email blocked: ${emailDomain} from IP: ${clientIp}`,
      );
      return NextResponse.json(
        {
          error: "Please use a permanent email address.",
          code: "disposable_email",
        },
        { status: 400 },
      );
    }

    // ========== LAYER 5: IP Rate Limiting ==========
    const ipRateLimit = contactLimiter.check(clientIp);
    if (!ipRateLimit.allowed) {
      console.log(`[Contact] IP rate limited: ${clientIp}`);
      return NextResponse.json(
        {
          error:
            "Too many submissions from your location. Please try again later.",
          code: "ip_rate_limited",
          retryAfter: ipRateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(ipRateLimit.retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    // ========== LAYER 6: Email Rate Limiting ==========
    const emailRateLimit = contactEmailLimiter.check(data.email.toLowerCase());
    if (!emailRateLimit.allowed) {
      console.log(`[Contact] Email rate limited: ${data.email}`);
      return NextResponse.json(
        {
          error:
            "You've already submitted recently. Please wait before submitting again.",
          code: "email_rate_limited",
          retryAfter: emailRateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(emailRateLimit.retryAfter),
          },
        },
      );
    }

    // ========== LAYER 7: reCAPTCHA Verification (if token provided) ==========
    const captchaToken = data._captchaToken;
    if (captchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const captchaResult = await verifyCaptcha(captchaToken);
      if (!captchaResult.success) {
        console.log(
          `[Contact] CAPTCHA failed from IP: ${clientIp}, score: ${captchaResult.score}`,
        );

        if (captchaResult.score !== undefined && captchaResult.score < 0.3) {
          // Very low score = likely bot
          return NextResponse.json(
            {
              error: "Verification failed. Please try again.",
              code: "captcha_failed",
              requireCaptcha: true,
            },
            { status: 400 },
          );
        }
        // Borderline score (0.3-0.5) - continue but flag for review
      }
    }

    // ========== LAYER 8: Content Checks ==========
    const linkCount = countLinks(data.message || "");
    if (linkCount > 3) {
      console.log(
        `[Contact] Too many links (${linkCount}) from IP: ${clientIp}`,
      );
      return NextResponse.json(
        {
          error: "Message contains too many links.",
          code: "too_many_links",
        },
        { status: 400 },
      );
    }

    // ========== ALL CHECKS PASSED - Save to Database ==========
    const supabase = getSupabaseServer();
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        full_name: data.fullName,
        email: data.email,
        school: data.school,
        undergraduate_year: data.undergraduateYear,
        message: data.message || null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Contact] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save submission", code: "db_error" },
        { status: 500 },
      );
    }

    // Send email alert to admin (non-blocking)
    sendAdminAlert({
      fullName: data.fullName,
      email: data.email,
      school: data.school,
      undergraduateYear: data.undergraduateYear,
      message: data.message,
    }).catch((err) => {
      console.error("[Contact] Email alert failed (non-blocking):", err);
    });

    console.log("[Contact] New lead submitted:", lead.id);
    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("[Contact] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 },
    );
  }
}

// Verify reCAPTCHA token with Google
async function verifyCaptcha(
  token: string,
): Promise<{ success: boolean; score?: number }> {
  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: token,
        }),
      },
    );

    const data = await response.json();
    return {
      success: data.success && (data.score === undefined || data.score >= 0.5),
      score: data.score,
    };
  } catch (error) {
    console.error("[Contact] CAPTCHA verification error:", error);
    // Fail open - don't block legitimate users if Google is down
    return { success: true };
  }
}

// Count URLs in text
function countLinks(text: string): number {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return (text.match(urlRegex) || []).length;
}

// Helper to send admin email alert
async function sendAdminAlert(data: {
  fullName: string;
  email: string;
  school: string;
  undergraduateYear: number;
  message?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendApiKey || !adminEmail) {
    console.log(
      "[Contact] Email alert skipped - missing RESEND_API_KEY or ADMIN_EMAIL",
    );
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://quantfident.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Quantfident <noreply@quantfident.com>",
      to: adminEmail,
      subject: `🆕 New Lead: ${data.fullName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.fullName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>School</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.school)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Year</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.undergraduateYear}</td>
          </tr>
        </table>
        ${
          data.message
            ? `
          <h3 style="margin-top: 20px;">Message</h3>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${escapeHtml(data.message)}</p>
        `
            : ""
        }
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p><a href="${baseUrl}/admin/leads">View all leads in Admin Dashboard</a></p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }
}

// Simple HTML escape to prevent XSS in emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
