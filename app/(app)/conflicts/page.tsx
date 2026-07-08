import { ConflictResolver } from "@/components/sync/conflict-resolver";
import { requireHouseholdContext } from "@/lib/households/context";
import { getPendingConflicts } from "@/lib/sync/conflict";

export default async function ConflictsPage() {
  const ctx = await requireHouseholdContext();
  const conflicts = await getPendingConflicts(ctx.householdId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sync conflicts</h1>
        <p className="mt-1 text-muted-foreground">
          {ctx.householdName} · choose which version to keep when Google and NTRR disagree
        </p>
      </div>

      <ConflictResolver
        conflicts={conflicts.map((row) => ({
          id: row.id as string,
          provider: row.provider as string,
          entityType: row.entity_type as string,
          entityId: row.entity_id as string,
          fieldName: row.field_name as string,
          localValue: row.local_value,
          remoteValue: row.remote_value,
          createdAt: row.created_at as string,
        }))}
      />
    </div>
  );
}