import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AiHighlightsSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Loading AI highlights">
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
        <CardDescription>Loading insights…</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </CardContent>
    </Card>
  );
}