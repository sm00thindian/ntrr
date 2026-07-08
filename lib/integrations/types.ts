export type GoogleTokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  connectedEmail?: string;
};

export type GoogleSyncState = {
  calendarSyncToken?: string;
  tasksSyncToken?: string;
  defaultTaskListId?: string;
};

export type IntegrationMetadata = {
  tokens?: GoogleTokenBundle;
  google?: GoogleSyncState;
};

export type IntegrationAccount = {
  id: string;
  householdId: string;
  provider: "google" | "microsoft" | "apple_caldav" | "zapier";
  status: "connected" | "disconnected" | "error" | "pending";
  scopes: string[] | null;
  metadata: IntegrationMetadata;
  createdAt: string;
  updatedAt: string;
};