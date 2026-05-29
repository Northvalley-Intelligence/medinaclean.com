import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const failures = [];

if (!commandExists("docker")) {
  failures.push("Docker CLI is not installed or not on PATH.");
} else {
  const docker = spawnSync("docker", ["info"], { encoding: "utf8" });
  if (docker.status !== 0) {
    failures.push("Docker is installed but the daemon is not running.");
  }
}

if (!commandExists("supabase")) {
  failures.push("Supabase CLI is not available on PATH. Run npm install first.");
}

if (!existsSync(".env.local")) {
  failures.push("Missing .env.local with local Supabase values.");
} else {
  const env = parseEnv(readFileSync(".env.local", "utf8"));
  requireLocalValue(env, "NEXT_PUBLIC_SUPABASE_URL", /^http:\/\/(127\.0\.0\.1|localhost):54321$/);
  requireLocalValue(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", /.+/);
  requireLocalValue(env, "SUPABASE_SERVICE_ROLE_KEY", /.+/);
  requireLocalValue(env, "ROSA_ADMIN_PASSWORD", /.+/);
  requireLocalValue(env, "ADMIN_SESSION_SECRET", /^.{32,}$/);
}

if (failures.length > 0) {
  console.error("Local Supabase preflight failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error("\nRun: npm run db:start && npm run db:reset");
  process.exit(1);
}

function commandExists(command) {
  return spawnSync("sh", ["-c", `command -v ${command}`], { encoding: "utf8" }).status === 0;
}

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^['"]|['"]$/g, "")];
      })
  );
}

function requireLocalValue(env, key, pattern) {
  const value = env[key] || "";
  if (!pattern.test(value)) {
    failures.push(`${key} is missing or not configured for local Supabase.`);
  }
}
