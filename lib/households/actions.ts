"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { upsertProfile } from "@/lib/profiles/actions";
import { createClient } from "@/lib/supabase/server";

export type CreateHouseholdState = { error?: string } | null;

export async function createHousehold(
  _prevState: CreateHouseholdState,
  formData: FormData,
): Promise<CreateHouseholdState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Household name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You are not signed in. Please refresh and try again." };
  }

  if (user.email) {
    await upsertProfile(user);
  }

  const { data: householdId, error } = await supabase.rpc("create_household", {
    household_name: name,
  });

  if (error) {
    if (error.message.includes("Not authenticated")) {
      return {
        error:
          "Session expired. Sign out, sign in again, then create your household in the same browser.",
      };
    }
    return { error: error.message };
  }

  if (!householdId) {
    return { error: "Could not create household." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/family");
  redirect("/dashboard");
}