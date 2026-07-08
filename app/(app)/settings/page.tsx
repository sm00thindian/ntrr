import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleConnectCard } from "@/components/integrations/google-connect-card";
import { requireHouseholdContext } from "@/lib/households/context";
import { isGoogleConfigured } from "@/lib/integrations/google/scopes";
import { getHouseholdIntegration } from "@/lib/integrations/queries";
import { canManageIntegrations } from "@/lib/permissions/roles";

function feedbackFromSearchParams(params: { [key: string]: string | string[] | undefined }) {
  if (params.connected === "google") {
    return "Google connected. Initial sync started.";
  }

  const error = typeof params.error === "string" ? params.error : null;
  if (!error) {
    return null;
  }

  if (error === "permission") {
    return "Only owners and admins can connect Google.";
  }

  return decodeURIComponent(error);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const ctx = await requireHouseholdContext();
  const canManage = canManageIntegrations(ctx.role);
  const params = await searchParams;
  const feedback = feedbackFromSearchParams(params);

  const googleIntegration = canManage
    ? await getHouseholdIntegration(ctx.householdId, "google")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Integrations and account preferences
          {!canManage ? " · view only" : ""}
        </p>
      </div>

      {!canManage ? (
        <p className="text-sm text-muted-foreground">
          Only owners and admins can connect integrations. Ask your household admin for access.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <GoogleConnectCard
          canManage={canManage}
          configured={isGoogleConfigured()}
          integration={googleIntegration}
          feedback={feedback}
        />

        <Card>
          <CardHeader>
            <CardTitle>Apple (CalDAV)</CardTitle>
            <CardDescription>iCloud calendar bridge — M4.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {canManage ? "Not connected" : "Connect unavailable for your role"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Microsoft</CardTitle>
            <CardDescription>Outlook sync — planned for v1.1.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming in 1.1</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}