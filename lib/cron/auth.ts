export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.SYNC_CRON_SECRET;

  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${secret}`) {
      return true;
    }
  }

  // Vercel scheduled cron invocations
  if (process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  return false;
}