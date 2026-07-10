export type ProvenanceSource = "ntrr" | "google" | "microsoft" | "apple_caldav" | "zapier";

export type ProvenanceConfidence = "high" | "medium" | "low";

export type ProvenanceModifier = "user" | "sync" | "ai";

export type Provenance = {
  source: ProvenanceSource;
  externalId?: string;
  calendarId?: string;
  calendarName?: string;
  syncedAt: string;
  confidence: ProvenanceConfidence;
  lastModifiedBy: ProvenanceModifier;
};