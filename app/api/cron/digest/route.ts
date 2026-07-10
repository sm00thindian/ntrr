import { NextResponse } from "next/server";

import { runDailyDigest } from "@/lib/ai/orchestrator";
import { isAuthorizedCron } from "@/lib/cron/auth";

async function handleDigest() {
  const results = await runDailyDigest();
  return NextResponse.json({ ok: true, households: results.length, results });
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleDigest();
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleDigest();
}