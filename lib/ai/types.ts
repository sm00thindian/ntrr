export type InsightType = "conflict" | "reminder" | "schedule";

export type InsightSeverity = "info" | "warning";

export type InsightPayload = {
  title: string;
  body?: string;
  actionHref?: string;
  severity?: InsightSeverity;
};

export type AiInsight = {
  id: string;
  householdId: string;
  type: InsightType;
  dedupeKey: string | null;
  title: string;
  body: string | null;
  actionHref: string | null;
  severity: InsightSeverity;
  snoozedUntil: string | null;
  createdAt: string;
};

export type AgentRunMode = "post-sync" | "daily";