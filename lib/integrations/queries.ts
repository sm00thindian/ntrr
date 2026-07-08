import { decryptJson } from "@/lib/integrations/crypto";
import type { GoogleTokenBundle, IntegrationAccount, IntegrationMetadata } from "@/lib/integrations/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type IntegrationRow = {
  id: string;
  household_id: string;
  provider: IntegrationAccount["provider"];
  status: IntegrationAccount["status"];
  scopes: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function mapIntegration(row: IntegrationRow): IntegrationAccount {
  const metadata = (row.metadata ?? {}) as IntegrationMetadata;

  if (typeof metadata.tokens === "string") {
    metadata.tokens = decryptJson<GoogleTokenBundle>(metadata.tokens);
  }

  return {
    id: row.id,
    householdId: row.household_id,
    provider: row.provider,
    status: row.status,
    scopes: row.scopes,
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getHouseholdIntegration(
  householdId: string,
  provider: IntegrationAccount["provider"],
): Promise<IntegrationAccount | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_accounts")
    .select("id, household_id, provider, status, scopes, metadata, created_at, updated_at")
    .eq("household_id", householdId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapIntegration(data as IntegrationRow);
}

export async function getConnectedGoogleIntegration(
  householdId: string,
): Promise<IntegrationAccount | null> {
  const account = await getHouseholdIntegration(householdId, "google");
  if (!account || account.status !== "connected" || !account.metadata.tokens) {
    return null;
  }
  return account;
}

export async function getConnectedGoogleIntegrationAdmin(
  householdId: string,
): Promise<IntegrationAccount | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("integration_accounts")
    .select("id, household_id, provider, status, scopes, metadata, created_at, updated_at")
    .eq("household_id", householdId)
    .eq("provider", "google")
    .eq("status", "connected")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const account = mapIntegration(data as IntegrationRow);
  if (!account.metadata.tokens) {
    return null;
  }

  return account;
}