"use client";

import { useState, useTransition } from "react";

import { AppIcon } from "@/components/brand/app-icon";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth/actions";

type LoginFormProps = {
  next?: string;
  initialError?: string | null;
};

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function buildCallbackUrl() {
    const base = `${window.location.origin}/auth/callback`;
    if (next && next.startsWith("/")) {
      return `${base}?next=${encodeURIComponent(next)}`;
    }
    return base;
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Logo href="/" size="lg" />
          <AppIcon size={36} />
        </div>
        <div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Your family coordination hub. Use email magic link or Google.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);

            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") ?? "").trim();

            startTransition(async () => {
              const supabase = createClient();
              const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo: buildCallbackUrl(),
                },
              });

              if (otpError) {
                setError(otpError.message);
                return;
              }

              setMessage(
                "Check Mailpit for your sign-in link. Open the link in this same browser.",
              );
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await signInWithGoogle(formData);
              if (result?.error) {
                setError(result.error);
              }
            });
          }}
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Button type="submit" variant="outline" className="w-full" disabled={pending}>
            Continue with Google
          </Button>
        </form>

        {message ? (
          <p className="rounded-md bg-accent/60 px-3 py-2 text-sm text-accent-foreground" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Local dev: magic links arrive in{" "}
          <a href="http://127.0.0.1:54324" className="underline" target="_blank" rel="noreferrer">
            Mailpit
          </a>
          . Request the link and open it in this same browser.
        </p>
      </CardContent>
    </Card>
  );
}