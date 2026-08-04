import { normalizeUsPhone } from "./phone";
import { selectServiceRows } from "./supabase-rest";

// GEN-001 TASK-008 — abuse protection for the public, unauthenticated agent-native write path (RISK-007).
// Assistants cannot solve a CAPTCHA, so the write path leans on: phone validation, honeypot, an optional
// shared secret, and a $0 Supabase-backed per-phone throttle. Pure policy is separated from Supabase IO
// (injected countRecent) so it stays deterministic and unit-testable.

const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_MAX_PER_WINDOW = 3;

export type PhoneValidation =
  | { ok: true; e164: string; display: string }
  | { ok: false; error: "invalid_phone" };

export function validateRequestPhone(phone: string): PhoneValidation {
  const normalized = normalizeUsPhone(String(phone ?? ""));
  if (!normalized) {
    return { ok: false, error: "invalid_phone" };
  }

  return { ok: true, e164: normalized.e164, display: normalized.display };
}

// Honeypot: a hidden field real users leave blank. Any non-whitespace content means a bot filled it.
export function isHoneypotTripped(value: string | undefined | null): boolean {
  return String(value ?? "").trim().length > 0;
}

// Optional shared secret between the MCP layer and a protected write endpoint. Disabled (allow) when
// unconfigured, mirroring the Turnstile helper so local/dev works without secrets.
export function verifySharedSecret(provided: string | undefined | null, expected: string | undefined | null): boolean {
  const want = String(expected ?? "");
  if (!want) {
    return true;
  }

  const got = String(provided ?? "");
  if (got.length !== want.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < want.length; i += 1) {
    mismatch |= got.charCodeAt(i) ^ want.charCodeAt(i);
  }

  return mismatch === 0;
}

export function evaluateThrottle({
  recentCount,
  maxPerWindow = DEFAULT_MAX_PER_WINDOW
}: {
  recentCount: number;
  maxPerWindow?: number;
}): { allowed: boolean } {
  return { allowed: recentCount < maxPerWindow };
}

export function windowStartIso(nowIso: string, windowMinutes: number): string {
  const start = new Date(new Date(nowIso).getTime() - windowMinutes * 60_000);
  return start.toISOString();
}

export type RateLimitResult = { allowed: boolean; recentCount: number };

export async function enforceAppointmentRateLimit(params: {
  phoneE164: string;
  nowIso: string;
  windowMinutes?: number;
  maxPerWindow?: number;
  countRecent: (args: { phoneE164: string; sinceIso: string }) => Promise<number>;
}): Promise<RateLimitResult> {
  const windowMinutes = params.windowMinutes ?? DEFAULT_WINDOW_MINUTES;
  const maxPerWindow = params.maxPerWindow ?? DEFAULT_MAX_PER_WINDOW;
  const sinceIso = windowStartIso(params.nowIso, windowMinutes);
  const recentCount = await params.countRecent({ phoneE164: params.phoneE164, sinceIso });

  return { recentCount, allowed: evaluateThrottle({ recentCount, maxPerWindow }).allowed };
}

// Default $0 Supabase throttle source: count recent appointment_requests for a phone in the window.
export async function countRecentAppointmentRequestsByPhone({
  phoneE164,
  sinceIso
}: {
  phoneE164: string;
  sinceIso: string;
}): Promise<number> {
  const params = new URLSearchParams({
    select: "id",
    phone: `eq.${phoneE164}`,
    created_at: `gte.${sinceIso}`
  });

  const rows = await selectServiceRows<{ id: string }>("appointment_requests", params.toString());
  return rows.length;
}
