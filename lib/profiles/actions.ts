"use server";

import { createClient } from "@/lib/supabase/server";

export async function upsertProfile(user: { id: string; email?: string | null }) {
  if (!user.email) {
    return;
  }

  const supabase = await createClient();

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email.toLowerCase(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}