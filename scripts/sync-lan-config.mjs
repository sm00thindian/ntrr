import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

import { getLanIp } from "./lan-ip.mjs";

const CONFIG_PATH = resolve("supabase/config.toml");
const BEGIN = "# BEGIN LAN (auto-managed by npm run dev:lan — do not edit)";
const END = "# END LAN";
const LOCAL_SITE_URL = "http://localhost:3000";

function buildLanBlock(ip) {
  const base = `http://${ip}:3000`;
  return [
    BEGIN,
    `  "${base}/auth/callback",`,
    `  "${base}/auth/callback/**",`,
    `  "${base}/**",`,
    `  ${END}`,
  ].join("\n");
}

function syncSiteUrl(config, ip) {
  const lanUrl = `http://${ip}:3000`;
  return config.replace(/^site_url = ".*"$/m, `site_url = "${lanUrl}"`);
}

export function syncLanConfig(ip) {
  let config = readFileSync(CONFIG_PATH, "utf8");
  const block = buildLanBlock(ip);
  const before = config;

  if (config.includes(BEGIN) && config.includes(END)) {
    const pattern = new RegExp(
      `${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    );
    config = config.replace(pattern, block);
  } else {
    config = config.replace(
      /additional_redirect_urls = \[\n/,
      `additional_redirect_urls = [\n${block}\n`,
    );
  }

  config = syncSiteUrl(config, ip);

  const changed = config !== before;
  if (changed) {
    writeFileSync(CONFIG_PATH, config);
  }

  return changed;
}

export function restoreLocalConfig() {
  let config = readFileSync(CONFIG_PATH, "utf8");
  const before = config;

  config = config.replace(/^site_url = ".*"$/m, `site_url = "${LOCAL_SITE_URL}"`);

  if (config.includes(BEGIN) && config.includes(END)) {
    const pattern = new RegExp(
      `${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    );
    config = config.replace(pattern, [BEGIN, `  ${END}`].join("\n"));
  }

  const changed = config !== before;
  if (changed) {
    writeFileSync(CONFIG_PATH, config);
  }

  return changed;
}

function main() {
  const restore = process.argv.includes("--restore");
  const ip = getLanIp();

  if (restore) {
    const changed = restoreLocalConfig();
    console.log("Restored Supabase config for localhost-only development.");
    if (changed) {
      console.log("Restart Supabase to apply: npm run db:restart");
    }
    return;
  }

  if (!ip) {
    console.error("Could not detect a LAN IP address. Connect to Wi‑Fi or Ethernet and retry.");
    process.exit(1);
  }

  const changed = syncLanConfig(ip);

  console.log(`LAN IP: ${ip}`);
  console.log(`App URL: http://${ip}:3000`);
  console.log(`Supabase API: http://${ip}:54321`);

  if (changed) {
    console.log("\nUpdated supabase/config.toml (site_url + LAN redirect URLs).");
    console.log("Restart Supabase to apply: npm run db:restart");
  } else {
    console.log("\nSupabase LAN config is already up to date.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}