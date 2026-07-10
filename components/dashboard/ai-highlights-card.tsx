"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiInsightRow } from "@/components/dashboard/ai-insight-row";
import type { AiInsight } from "@/lib/ai/types";

type AiHighlightsCardProps = {
  insights: AiInsight[];
  error?: string | null;
};

export function AiHighlightsCard({ insights, error }: AiHighlightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
        <CardDescription>
          Sync conflicts, overdue tasks, and schedule overlaps — suggestions only, you stay in
          control.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {insights.length ? (
          <ul className="space-y-3">
            {insights.map((insight) => (
              <AiInsightRow key={insight.id} insight={insight} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No highlights right now. Run sync or the daily digest to refresh insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}