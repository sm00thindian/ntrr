import os from "os";

/**
 * Pick the best IPv4 address for LAN dev (Wi‑Fi first, then common private ranges).
 */
export function getLanIp() {
  const candidates = [];

  for (const [name, nets] of Object.entries(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      candidates.push({ name, address: net.address });
    }
  }

  const byName = (n) => candidates.find((c) => c.name === n);
  const byPrefix = (prefix) => candidates.find((c) => c.address.startsWith(prefix));

  return (
    byName("en0")?.address ??
    byPrefix("192.168.")?.address ??
    byPrefix("10.")?.address ??
    candidates[0]?.address ??
    null
  );
}