import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { runAllGoogleSyncs } from "@/lib/sync/orchestrator";

async function handleSync() {
  const results = await runAllGoogleSyncs();
  return NextResponse.json({ ok: true, results });
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleSync();
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleSync();
}