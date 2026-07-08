import Link from "next/link";
import { redirect } from "next/navigation";

import { AppIcon } from "@/components/brand/app-icon";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo href="/" size="lg" />
        <AppIcon size={40} />
      </div>

      <div className="space-y-4">
        <p className="font-display text-brand text-sm font-medium">Family Care Orchestrator</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          One calm dashboard for family care coordination
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
          Unify calendars, tasks, and family handoffs across the tools you already use — built for
          Gen X caregivers who need reliability, not another app to babysit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
          <Link href="/login">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}