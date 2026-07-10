import { NextResponse } from "next/server";

import { completeAuthCallback } from "@/lib/supabase/auth-callback";
import { getRequestOrigin } from "@/lib/request-origin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const next = searchParams.get("next") ?? "/dashboard";
  const destination = next.startsWith("/") ? next : "/dashboard";

  const result = await completeAuthCallback(searchParams);

  if (result.ok) {
    return NextResponse.redirect(`${origin}${destination}`);
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  if (result.reason && result.reason !== "missing_code") {
    loginUrl.searchParams.set("message", result.reason);
  }

  return NextResponse.redirect(loginUrl);
}