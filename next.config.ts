import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

export const SHARED_OPENROUTER_ENV_FILE = join(homedir(), "code", ".northvalley", "openrouter.env");

// Local dev only: fall back to the shared OpenRouter key file when no repo-local
// env (.env.local, already loaded by Next) has set the key.
export function loadSharedOpenRouterEnv(
  phase: string,
  file: string = SHARED_OPENROUTER_ENV_FILE,
  env: Record<string, string | undefined> = process.env,
  load: (path: string) => void = (path) => process.loadEnvFile(path)
) {
  if (phase !== PHASE_DEVELOPMENT_SERVER || env.OPENROUTER_API_KEY || !existsSync(file)) {
    return;
  }
  load(file);
}

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "77mb",
    serverActions: {
      bodySizeLimit: "77mb"
    }
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "www.medinaclean.com" }],
        destination: "https://medinaclean.com/en",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.medinaclean.com" }],
        destination: "https://medinaclean.com/:path*",
        permanent: true
      },
      {
        source: "/our-services",
        destination: "/en#services",
        permanent: true
      },
      {
        source: "/pricing-plans",
        destination: "/en#pricing",
        permanent: true
      },
      {
        source: "/pricing-for-residential",
        destination: "/en#pricing",
        permanent: true
      },
      {
        source: "/contactus",
        destination: "/en#schedule",
        permanent: true
      }
    ];
  }
};

export default function config(phase: string): NextConfig {
  loadSharedOpenRouterEnv(phase);
  return nextConfig;
}
