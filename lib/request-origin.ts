/** Resolve the public origin when Next.js is bound to 0.0.0.0 (LAN dev). */
export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  if (url.hostname !== "0.0.0.0") {
    return url.origin;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    return `${url.protocol}//${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
}