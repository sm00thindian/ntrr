import { existsSync, readFileSync } from "fs";
import { spawn } from "child_process";
import { resolve } from "path";

import { getLanIp } from "./lan-ip.mjs";
import { syncLanConfig } from "./sync-lan-config.mjs";

function loadEnvLocal() {
  const path = resolve(".env.local");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const ip = getLanIp();
if (!ip) {
  console.error("Could not detect a LAN IP address. Connect to Wi‑Fi or Ethernet and retry.");
  process.exit(1);
}

loadEnvLocal();

const siteUrl = `http://${ip}:3000`;
const supabaseUrl = `http://${ip}:54321`;

process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;

const configChanged = syncLanConfig(ip);

console.log("\nNTRR — LAN development mode\n");
console.log(`  App:       ${siteUrl}`);
console.log(`  Supabase:  ${supabaseUrl}`);
console.log(`  Mailpit:   http://${ip}:54324`);
console.log(`  Studio:    http://${ip}:54323`);

if (configChanged) {
  console.log("\n  Supabase auth config updated — run in another terminal:");
  console.log("    npm run db:restart");
}

console.log("\n  Google OAuth redirect URI (add in Cloud Console if testing sync):");
console.log(`    ${siteUrl}/api/integrations/google/callback`);
console.log("\n  Starting Next.js on 0.0.0.0:3000 …\n");

const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));