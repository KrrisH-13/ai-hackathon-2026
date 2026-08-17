#!/usr/bin/env node
/**
 * Reads connection info for the running local Supabase stack (`supabase
 * status -o json`) and writes it into `.env.local`, preserving any other
 * variables already there. Run after `npm run db:start`.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_PATH = ".env.local";

const STATUS_KEY_TO_ENV_KEY = {
  API_URL: "NEXT_PUBLIC_SUPABASE_URL",
  ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
};

function getLocalSupabaseStatus() {
  let raw;
  try {
    raw = execSync("npx supabase status -o json", { encoding: "utf8" });
  } catch {
    console.error(
      "Could not reach the local Supabase stack. Run `npm run db:start` first (requires Docker Desktop to be running)."
    );
    process.exit(1);
  }
  return JSON.parse(raw);
}

function mergeEnvFile(path, updates) {
  const existingLines = existsSync(path) ? readFileSync(path, "utf8").split("\n") : [];
  const keys = Object.keys(updates);
  const seen = new Set();

  const merged = existingLines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match && keys.includes(match[1])) {
      seen.add(match[1]);
      return `${match[1]}=${updates[match[1]]}`;
    }
    return line;
  });

  for (const key of keys) {
    if (!seen.has(key)) merged.push(`${key}=${updates[key]}`);
  }

  writeFileSync(path, merged.join("\n").replace(/\n+$/, "\n") + "\n");
}

const status = getLocalSupabaseStatus();
const updates = {};

for (const [statusKey, envKey] of Object.entries(STATUS_KEY_TO_ENV_KEY)) {
  if (!(statusKey in status)) {
    console.error(
      `Expected key "${statusKey}" was not found in \`supabase status -o json\` output.\n` +
        "The Supabase CLI's output shape may have changed. Raw output:\n" +
        JSON.stringify(status, null, 2)
    );
    process.exit(1);
  }
  updates[envKey] = status[statusKey];
}

mergeEnvFile(ENV_PATH, updates);

console.log(`Updated ${ENV_PATH} with local Supabase credentials:`);
for (const key of Object.values(STATUS_KEY_TO_ENV_KEY)) {
  console.log(`  ${key}`);
}
