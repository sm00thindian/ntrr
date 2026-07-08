import { NextResponse } from "next/server";

import { runAllGoogleSyncs } from "@/lib/sync/orchestrator";

export async function POST(request: Request) {
  const secret = process.env.SYNC_CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAllGoogleSyncs();

  return NextResponse.json({ ok: true, results });
}