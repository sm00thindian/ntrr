import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ZapierWebhookCardProps = {
  householdId: string;
  configured: boolean;
};

export function ZapierWebhookCard({ householdId, configured }: ZapierWebhookCardProps) {
  const endpoint = `/api/webhooks/zapier`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zapier / Make</CardTitle>
        <CardDescription>One-way Apple Reminders ingest into your family task board.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          POST JSON to <code className="rounded bg-muted px-1 py-0.5">{endpoint}</code> with header{" "}
          <code className="rounded bg-muted px-1 py-0.5">Authorization: Bearer &lt;ZAPIER_WEBHOOK_SECRET&gt;</code>
        </p>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs">
{`{
  "householdId": "${householdId}",
  "title": "Pick up prescription",
  "dueAt": "2026-07-08T17:00:00.000Z",
  "description": "Optional notes"
}`}
        </pre>
        {!configured ? (
          <p className="text-muted-foreground text-xs">
            Add ZAPIER_WEBHOOK_SECRET to .env.local to enable the endpoint.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}