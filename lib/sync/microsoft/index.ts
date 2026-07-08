/**
 * Microsoft Graph sync — stub for 1.1.
 * Provider interface will be implemented in the fast-follow release.
 */

export const MICROSOFT_SYNC_ENABLED = false;

export async function pullMicrosoftChanges(): Promise<void> {
  if (!MICROSOFT_SYNC_ENABLED) {
    return;
  }
  throw new Error("Microsoft sync is not available until v1.1.");
}