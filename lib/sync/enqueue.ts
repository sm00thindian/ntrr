import { getConnectedGoogleIntegration } from "@/lib/integrations/queries";
import { enqueueSyncOutbox } from "@/lib/sync/outbox";

export async function enqueueGoogleTaskSync(params: {
  householdId: string;
  taskId: string;
  operation: "create" | "update" | "delete";
  payload?: Record<string, unknown>;
}) {
  const integration = await getConnectedGoogleIntegration(params.householdId);
  if (!integration) {
    return;
  }

  await enqueueSyncOutbox({
    householdId: params.householdId,
    provider: "google",
    entityType: "task",
    entityId: params.taskId,
    operation: params.operation,
    payload: params.payload,
  });
}