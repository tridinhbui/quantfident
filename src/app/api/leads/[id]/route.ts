// Admin lead status update endpoint
// PATCH /api/leads/[id] - Update lead status

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  verifySessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/server-auth";

const VALID_STATUSES = ["new", "contacted", "resolved"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verify admin session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const user = await verifySessionCookie(sessionCookie, true);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required", code: "forbidden" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: new, contacted, resolved",
          code: "validation_error",
        },
        { status: 400 },
      );
    }

    // Update in Supabase
    const supabase = getSupabaseServer();
    const { data: lead, error } = await supabase
      .from("leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Lead not found", code: "not_found" },
          { status: 404 },
        );
      }
      console.error("[Leads] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update lead", code: "db_error" },
        { status: 500 },
      );
    }

    console.log(`[Leads] Status updated: ${id} → ${status} by ${user.email}`);
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[Leads] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 },
    );
  }
}
