// Admin leads list endpoint
// GET /api/leads - Returns all leads for admin dashboard

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  verifySessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/server-auth";

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    // Query Supabase
    const supabase = getSupabaseServer();
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && ["new", "contacted", "resolved"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("[Leads] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leads", code: "db_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      leads,
      count: leads.length,
    });
  } catch (error) {
    console.error("[Leads] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "internal_error" },
      { status: 500 },
    );
  }
}
