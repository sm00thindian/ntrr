import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type ZapierTaskPayload = {
  householdId?: string;
  title?: string;
  description?: string;
  dueAt?: string;
};

function defaultProvenance() {
  return {
    source: "zapier" as const,
    syncedAt: new Date().toISOString(),
    confidence: "medium" as const,
    lastModifiedBy: "sync" as const,
  };
}

export async function POST(request: Request) {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ZapierTaskPayload;
  try {
    body = (await request.json()) as ZapierTaskPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const householdId = body.householdId?.trim();
  const title = body.title?.trim();

  if (!householdId || !title) {
    return NextResponse.json(
      { error: "householdId and title are required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: household, error: householdError } = await admin
    .from("households")
    .select("id, created_by")
    .eq("id", householdId)
    .maybeSingle();

  if (householdError || !household?.created_by) {
    return NextResponse.json({ error: "Household not found." }, { status: 404 });
  }

  const { data: task, error } = await admin
    .from("tasks")
    .insert({
      household_id: householdId,
      title,
      description: body.description?.trim() || null,
      due_at: body.dueAt ?? null,
      status: "todo",
      provenance: defaultProvenance(),
      created_by: household.created_by,
    })
    .select("id, title")
    .single();

  if (error || !task) {
    return NextResponse.json({ error: error?.message ?? "Could not create task." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task });
}