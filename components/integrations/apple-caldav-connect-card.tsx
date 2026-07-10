"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectAppleCalDav, disconnectAppleCalDav } from "@/lib/integrations/apple/actions";
import type { IntegrationAccount } from "@/lib/integrations/types";

type AppleCalDavConnectCardProps = {
  canManage: boolean;
  integration: IntegrationAccount | null;
};

export function AppleCalDavConnectCard({ canManage, integration }: AppleCalDavConnectCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const connected = integration?.status === "connected";
  const calendarName = integration?.metadata.apple?.caldav?.calendarName;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apple (CalDAV)</CardTitle>
        <CardDescription>
          iCloud calendar via app-specific password. Reminders sync is one-way through Zapier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">
          {connected ? `Connected${calendarName ? ` · ${calendarName}` : ""}` : "Not connected"}
        </p>

        {message ? (
          <p className="rounded-md bg-accent/60 px-3 py-2 text-sm" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {canManage && !connected ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              setMessage(null);
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                const result = await connectAppleCalDav(formData);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setMessage("Apple calendar connected. Events are syncing to your family agenda.");
                event.currentTarget.reset();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="appleId">Apple ID</Label>
              <Input
                id="appleId"
                name="appleId"
                type="email"
                autoComplete="username"
                placeholder="you@icloud.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appPassword">App-specific password</Label>
              <Input
                id="appPassword"
                name="appPassword"
                type="password"
                autoComplete="current-password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                required
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Create one at{" "}
              <a
                href="https://appleid.apple.com/account/manage"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                appleid.apple.com
              </a>{" "}
              → Sign-In and Security → App-Specific Passwords.
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Connecting…" : "Connect Apple Calendar"}
            </Button>
          </form>
        ) : null}

        {canManage && connected ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await disconnectAppleCalDav();
                if (result.error) {
                  setError(result.error);
                }
              })
            }
          >
            Disconnect
          </Button>
        ) : null}

        {!canManage ? (
          <p className="text-sm text-muted-foreground">Connect unavailable for your role.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}