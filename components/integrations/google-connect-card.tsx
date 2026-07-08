"use client";

import { useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { disconnectGoogle, syncGoogleNow } from "@/lib/integrations/actions";
import type { IntegrationAccount } from "@/lib/integrations/types";

type GoogleConnectCardProps = {
  canManage: boolean;
  configured: boolean;
  integration: IntegrationAccount | null;
  feedback?: string | null;
};

function statusLabel(integration: IntegrationAccount | null) {
  if (!integration) {
    return "Not connected";
  }

  switch (integration.status) {
    case "connected":
      return "Connected";
    case "error":
      return "Error — reconnect recommended";
    case "pending":
      return "Pending";
    default:
      return "Disconnected";
  }
}

export function GoogleConnectCard({
  canManage,
  configured,
  integration,
  feedback,
}: GoogleConnectCardProps) {
  const [pending, startTransition] = useTransition();
  const connected = integration?.status === "connected";
  const email = integration?.metadata.tokens?.connectedEmail;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google</CardTitle>
        <CardDescription>Calendar and Tasks — bidirectional sync.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{statusLabel(integration)}</p>
          {email ? <p className="text-muted-foreground">{email}</p> : null}
          {!configured ? (
            <p className="text-muted-foreground">
              Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable connection.
            </p>
          ) : null}
        </div>

        {feedback ? (
          <p className="text-sm text-muted-foreground" role="status">
            {feedback}
          </p>
        ) : null}

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {configured && !connected ? (
              <Button asChild>
                <Link href="/api/integrations/google/connect">Connect Google</Link>
              </Button>
            ) : null}

            {connected ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(() => void syncGoogleNow())}
                >
                  {pending ? "Syncing…" : "Sync now"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => startTransition(() => void disconnectGoogle())}
                >
                  Disconnect
                </Button>
              </>
            ) : null}

            {configured && connected ? (
              <Button asChild variant="ghost">
                <Link href="/api/integrations/google/connect">Reconnect</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Connect unavailable for your role.</p>
        )}
      </CardContent>
    </Card>
  );
}