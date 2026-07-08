import { GoogleApiError, googleFetch } from "@/lib/integrations/google/client";
import type { IntegrationAccount } from "@/lib/integrations/types";
import { recordSyncConflict } from "@/lib/sync/conflict";
import { createAdminClient } from "@/lib/supabase/admin";

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  etag?: string;
  updated?: string;
  status?: string;
};

function eventProvenance(event: GoogleEvent) {
  return {
    source: "google" as const,
    externalId: event.id,
    syncedAt: new Date().toISOString(),
    confidence: "high" as const,
    lastModifiedBy: "sync" as const,
  };
}

function parseEventTimes(event: GoogleEvent) {
  const allDay = Boolean(event.start?.date);
  const startsAt = event.start?.dateTime ?? event.start?.date;
  const endsAt = event.end?.dateTime ?? event.end?.date;

  if (!startsAt || !endsAt) {
    return null;
  }

  return {
    allDay,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
  };
}

export async function pullGoogleCalendar(account: IntegrationAccount) {
  const admin = createAdminClient();
  const householdId = account.householdId;
  const syncToken = account.metadata.google?.calendarSyncToken;

  const path = syncToken
    ? `/calendar/v3/calendars/primary/events?syncToken=${encodeURIComponent(syncToken)}`
    : "/calendar/v3/calendars/primary/events?singleEvents=true&maxResults=100&orderBy=startTime";

  let payload: {
    items?: GoogleEvent[];
    nextSyncToken?: string;
  };

  try {
    payload = (await googleFetch(account, path)) as typeof payload;
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === 410) {
      await admin
        .from("integration_accounts")
        .update({
          metadata: {
            ...account.metadata,
            google: { ...account.metadata.google, calendarSyncToken: undefined },
          },
        })
        .eq("id", account.id);
      return pullGoogleCalendar({
        ...account,
        metadata: { ...account.metadata, google: { ...account.metadata.google, calendarSyncToken: undefined } },
      });
    }
    throw error;
  }

  for (const item of payload.items ?? []) {
    if (!item.id) {
      continue;
    }

    const { data: mapping } = await admin
      .from("sync_mappings")
      .select("id, ntrr_id, external_etag")
      .eq("household_id", householdId)
      .eq("provider", "google")
      .eq("entity_type", "calendar_event")
      .eq("external_id", item.id)
      .maybeSingle();

    if (item.status === "cancelled") {
      if (mapping?.ntrr_id) {
        await admin.from("calendar_events").delete().eq("id", mapping.ntrr_id);
        await admin.from("sync_mappings").delete().eq("id", mapping.id);
      }
      continue;
    }

    const times = parseEventTimes(item);
    if (!times) {
      continue;
    }

    const title = item.summary ?? "Untitled event";
    const remoteUpdatedAt = item.updated ? new Date(item.updated).toISOString() : null;

    if (mapping?.ntrr_id) {
      const { data: localEvent } = await admin
        .from("calendar_events")
        .select("title, starts_at, ends_at, updated_at")
        .eq("id", mapping.ntrr_id)
        .maybeSingle();

      if (
        localEvent &&
        mapping.external_etag &&
        item.etag &&
        mapping.external_etag !== item.etag &&
        new Date(localEvent.updated_at).getTime() > new Date(item.updated ?? 0).getTime()
      ) {
        await recordSyncConflict({
          householdId,
          provider: "google",
          entityType: "calendar_event",
          entityId: mapping.ntrr_id,
          fieldName: "title",
          localValue: localEvent.title,
          remoteValue: title,
        });
        continue;
      }

      await admin
        .from("calendar_events")
        .update({
          title,
          description: item.description ?? null,
          location: item.location ?? null,
          starts_at: times.startsAt,
          ends_at: times.endsAt,
          all_day: times.allDay,
          provenance: eventProvenance(item),
        })
        .eq("id", mapping.ntrr_id);

      await admin
        .from("sync_mappings")
        .update({
          external_etag: item.etag ?? null,
          external_updated_at: remoteUpdatedAt,
        })
        .eq("id", mapping.id);
    } else {
      const { data: created } = await admin
        .from("calendar_events")
        .insert({
          household_id: householdId,
          title,
          description: item.description ?? null,
          location: item.location ?? null,
          starts_at: times.startsAt,
          ends_at: times.endsAt,
          all_day: times.allDay,
          provenance: eventProvenance(item),
        })
        .select("id")
        .single();

      if (created?.id) {
        await admin.from("sync_mappings").insert({
          household_id: householdId,
          provider: "google",
          entity_type: "calendar_event",
          ntrr_id: created.id,
          external_id: item.id,
          external_etag: item.etag ?? null,
          external_updated_at: remoteUpdatedAt,
        });
      }
    }
  }

  if (payload.nextSyncToken) {
    await admin
      .from("integration_accounts")
      .update({
        metadata: {
          ...account.metadata,
          google: { ...account.metadata.google, calendarSyncToken: payload.nextSyncToken },
        },
      })
      .eq("id", account.id);
  }
}

export async function pushGoogleCalendarEvent(
  account: IntegrationAccount,
  entry: {
    entityId: string;
    operation: "create" | "update" | "delete";
    payload: Record<string, unknown>;
  },
) {
  const admin = createAdminClient();
  const householdId = account.householdId;

  const { data: mapping } = await admin
    .from("sync_mappings")
    .select("id, external_id, external_etag")
    .eq("household_id", householdId)
    .eq("provider", "google")
    .eq("entity_type", "calendar_event")
    .eq("ntrr_id", entry.entityId)
    .maybeSingle();

  if (entry.operation === "delete") {
    if (!mapping?.external_id) {
      return;
    }

    try {
      await googleFetch(
        account,
        `/calendar/v3/calendars/primary/events/${encodeURIComponent(mapping.external_id)}`,
        { method: "DELETE", etag: mapping.external_etag ?? undefined },
      );
    } catch (error) {
      if (error instanceof GoogleApiError && error.status === 412) {
        await recordSyncConflict({
          householdId,
          provider: "google",
          entityType: "calendar_event",
          entityId: entry.entityId,
          fieldName: "delete",
          localValue: { deleted: true },
          remoteValue: { deleted: false },
        });
      } else {
        throw error;
      }
    }
    return;
  }

  const title = String(entry.payload.title ?? "Untitled event");
  const startsAt = String(entry.payload.startsAt ?? new Date().toISOString());
  const endsAt = String(entry.payload.endsAt ?? new Date(Date.now() + 3_600_000).toISOString());
  const allDay = Boolean(entry.payload.allDay);

  const body = {
    summary: title,
    description: entry.payload.description ?? undefined,
    location: entry.payload.location ?? undefined,
    start: allDay ? { date: startsAt.slice(0, 10) } : { dateTime: startsAt },
    end: allDay ? { date: endsAt.slice(0, 10) } : { dateTime: endsAt },
  };

  if (mapping?.external_id) {
    try {
      const updated = (await googleFetch(
        account,
        `/calendar/v3/calendars/primary/events/${encodeURIComponent(mapping.external_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          etag: mapping.external_etag ?? undefined,
        },
      )) as GoogleEvent;

      await admin
        .from("sync_mappings")
        .update({
          external_etag: updated.etag ?? null,
          external_updated_at: updated.updated ? new Date(updated.updated).toISOString() : null,
        })
        .eq("id", mapping.id);
    } catch (error) {
      if (error instanceof GoogleApiError && (error.status === 412 || error.status === 409)) {
        await recordSyncConflict({
          householdId,
          provider: "google",
          entityType: "calendar_event",
          entityId: entry.entityId,
          fieldName: "title",
          localValue: title,
          remoteValue: "Remote copy changed on Google",
        });
      } else {
        throw error;
      }
    }
    return;
  }

  const created = (await googleFetch(account, "/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })) as GoogleEvent;

  if (!created.id) {
    return;
  }

  await admin.from("sync_mappings").upsert(
    {
      household_id: householdId,
      provider: "google",
      entity_type: "calendar_event",
      ntrr_id: entry.entityId,
      external_id: created.id,
      external_etag: created.etag ?? null,
      external_updated_at: created.updated ? new Date(created.updated).toISOString() : null,
    },
    { onConflict: "household_id,provider,entity_type,ntrr_id" },
  );
}