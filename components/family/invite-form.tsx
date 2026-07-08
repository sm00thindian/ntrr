"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvite } from "@/lib/households/invite-actions";
import { HOUSEHOLD_ROLES } from "@/lib/permissions/roles";

const INVITABLE_ROLES = HOUSEHOLD_ROLES.filter((r) => r !== "owner");

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a family member</CardTitle>
        <CardDescription>
          Send an invite link by email. Copy the link and share it directly for now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => {
            setError(null);
            setInviteUrl(null);
            startTransition(async () => {
              const result = await createInvite(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              if (result?.inviteUrl) {
                setInviteUrl(result.inviteUrl);
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="caregiver@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="caregiver"
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {INVITABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating invite…" : "Create invite link"}
          </Button>
        </form>

        {inviteUrl ? (
          <div className="mt-4 space-y-2 rounded-md border bg-muted/40 p-3">
            <p className="text-sm font-medium">Invite link ready</p>
            <p className="break-all text-sm text-muted-foreground">{inviteUrl}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
            >
              Copy link
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}