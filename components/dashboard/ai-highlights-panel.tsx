import { Suspense } from "react";

import { AiHighlightsCard } from "@/components/dashboard/ai-highlights-card";
import { AiHighlightsSkeleton } from "@/components/dashboard/ai-highlights-skeleton";
import { getActiveAiInsights } from "@/lib/ai/queries";

async function AiHighlightsContent({ householdId }: { householdId: string }) {
  try {
    const insights = await getActiveAiInsights(householdId);
    return <AiHighlightsCard insights={insights} />;
  } catch {
    return (
      <AiHighlightsCard
        insights={[]}
        error="Could not load AI highlights. Refresh the page to try again."
      />
    );
  }
}

export function AiHighlightsPanel({ householdId }: { householdId: string }) {
  return (
    <Suspense fallback={<AiHighlightsSkeleton />}>
      <AiHighlightsContent householdId={householdId} />
    </Suspense>
  );
}