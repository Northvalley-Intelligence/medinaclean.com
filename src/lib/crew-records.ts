import { normalizeUsPhone } from "./phone";

const crewRoles = ["owner", "cleaner", "contractor"] as const;
const crewStatuses = ["active", "inactive"] as const;

export type CrewMemberRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: (typeof crewRoles)[number];
  status: (typeof crewStatuses)[number];
  is_rosa: boolean;
  default_weekday_start: string;
  default_weekday_end: string;
  notes: string | null;
};

export type CrewUnavailabilityRow = {
  id: string;
  created_at: string;
  crew_member_id: string;
  start_at: string;
  end_at: string;
  reason: string;
  notes: string | null;
};

export function parseCrewMemberPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const name = clean(input.name, 120);
  const phone = clean(input.phone, 40);
  const email = clean(input.email, 180).toLowerCase();
  const normalizedPhone = phone ? normalizeUsPhone(phone) : null;

  if (!name) {
    errors.push("Crew member name is required.");
  }

  if (phone && !normalizedPhone) {
    errors.push("Crew member phone must be a valid 10-digit US number.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Crew member email must be valid.");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      name,
      phone: normalizedPhone?.e164 || null,
      email: email || null,
      role: allowed(input.role, crewRoles, "cleaner"),
      status: allowed(input.status, crewStatuses, "active"),
      is_rosa: toBoolean(input.isRosa || input.is_rosa),
      default_weekday_start: clean(input.defaultWeekdayStart || input.default_weekday_start, 5) || "10:00",
      default_weekday_end: clean(input.defaultWeekdayEnd || input.default_weekday_end, 5) || "17:00",
      notes: clean(input.notes, 1000) || null
    }
  };
}

export function parseCrewUnavailabilityPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const crewMemberId = clean(input.crewMemberId || input.crew_member_id, 80);
  const startAt = parseRequiredDate(input.startAt || input.start_at);
  const endAt = parseRequiredDate(input.endAt || input.end_at);

  if (!isUuid(crewMemberId)) {
    errors.push("Crew member id is required.");
  }

  if (startAt === "invalid") {
    errors.push("Unavailable start time must be valid.");
  }

  if (endAt === "invalid") {
    errors.push("Unavailable end time must be valid.");
  }

  if (
    startAt !== "invalid" &&
    endAt !== "invalid" &&
    new Date(endAt).getTime() <= new Date(startAt).getTime()
  ) {
    errors.push("Unavailable end time must be after start time.");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      crew_member_id: crewMemberId,
      start_at: startAt,
      end_at: endAt,
      reason: clean(input.reason, 160) || "Unavailable",
      notes: clean(input.notes, 1000) || null
    }
  };
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseRequiredDate(value: unknown) {
  const cleaned = clean(value, 80);
  if (!cleaned) {
    return "invalid";
  }

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed.toISOString();
}

function allowed<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  return values.includes(String(value) as T[number]) ? (String(value) as T[number]) : fallback;
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
