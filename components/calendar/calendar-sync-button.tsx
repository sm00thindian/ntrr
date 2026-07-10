"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { syncGoogleNow } from "@/lib/integrations/actions";

export function CalendarSyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await syncGoogleNow();
          router.refresh();
        })
      }
    >
      {pending ? "Syncing…" : "Sync now"}
    </Button>
  );
}