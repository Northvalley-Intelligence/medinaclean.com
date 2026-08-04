import { validateAppointmentRequestPayload } from "./appointment-request";
import { extractZip, validateServiceArea } from "./service-area";
import { buildAppointmentNotificationText, trySendSiteNotification } from "./site-notifications";
import { insertRow } from "./supabase-rest";

// GEN-001 TASK-009 (extraction) — the single appointment intake path shared by the public form route
// (/api/appointments) and the agent-native MCP request_appointment tool. There is exactly one intake,
// one Supabase table, and one Rosa notification (RISK-008: no parallel booking path).

export type AppointmentIntakeSource = "website" | "chat_agent" | "mcp_assistant";

export type AppointmentIntakeInput = {
  language?: unknown;
  name?: unknown;
  phone?: unknown;
  address?: unknown;
  zipCode?: unknown;
  serviceType?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  preferredTime1?: unknown;
  preferredTime2?: unknown;
  preferredTime3?: unknown;
  notes?: unknown;
  source?: unknown;
};

export type AppointmentRow = {
  language: "en" | "es";
  name: string;
  phone: string;
  address: string;
  zip_code: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  preferred_time_1: string;
  preferred_time_2: string;
  preferred_time_3: string;
  notes: string | null;
  distance_miles: number | null;
  source: AppointmentIntakeSource;
};

export type PrepareAppointmentResult =
  | { ok: true; row: AppointmentRow }
  | { ok: false; status: number; error: string };

const requiredFields = [
  "language",
  "name",
  "phone",
  "address",
  "serviceType",
  "bedrooms",
  "bathrooms",
  "preferredTime1",
  "preferredTime2",
  "preferredTime3"
] as const;

// Pure validation + row shaping. Mirrors the original /api/appointments order: ZIP first, then required
// fields, then bedroom/bathroom/time payload validation.
export function prepareAppointmentIntake(body: AppointmentIntakeInput): PrepareAppointmentResult {
  const record = body as Record<string, unknown>;
  const zipCode = String(record.zipCode || extractZip(String(record.address || ""))).trim();
  const validation = validateServiceArea(zipCode);
  if (!validation.ok) {
    return { ok: false, status: 400, error: validation.message };
  }

  for (const field of requiredFields) {
    if (!record[field]) {
      return { ok: false, status: 400, error: `Missing ${field}.` };
    }
  }

  const payloadValidation = validateAppointmentRequestPayload({
    bedrooms: Number(record.bedrooms),
    bathrooms: Number(record.bathrooms),
    preferredTime1: String(record.preferredTime1),
    preferredTime2: String(record.preferredTime2),
    preferredTime3: String(record.preferredTime3)
  });
  if (!payloadValidation.ok) {
    return { ok: false, status: 400, error: payloadValidation.error };
  }

  const row: AppointmentRow = {
    language: record.language === "es" ? "es" : "en",
    name: clean(record.name, 120),
    phone: clean(record.phone, 40),
    address: clean(record.address, 260),
    zip_code: zipCode,
    service_type: clean(record.serviceType, 120),
    bedrooms: payloadValidation.bedrooms,
    bathrooms: payloadValidation.bathrooms,
    preferred_time_1: payloadValidation.preferredTime1,
    preferred_time_2: payloadValidation.preferredTime2,
    preferred_time_3: payloadValidation.preferredTime3,
    notes: clean(record.notes || "", 1200) || null,
    distance_miles: validation.distanceMiles,
    source: normalizeSource(record.source)
  };

  return { ok: true, row };
}

// Persist the pending request and notify Rosa. The row lands in appointment_requests with the schema
// default status 'pending' (never accepted). Returns the new row id for a request reference.
export async function persistAppointmentIntake(row: AppointmentRow): Promise<{ id: string | null }> {
  const inserted = (await insertRow("appointment_requests", row)) as Array<{ id?: string }>;
  const id = inserted?.[0]?.id ?? null;

  await trySendSiteNotification({
    subject: `New Medina Clean appointment request: ${row.name}`,
    text: buildAppointmentNotificationText({
      language: row.language,
      name: row.name,
      phone: row.phone,
      address: row.address,
      zipCode: row.zip_code,
      serviceType: row.service_type,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      preferredTimes: [row.preferred_time_1, row.preferred_time_2, row.preferred_time_3],
      notes: row.notes,
      source: row.source
    })
  });

  return { id };
}

function normalizeSource(value: unknown): AppointmentIntakeSource {
  if (value === "chat_agent") {
    return "chat_agent";
  }
  if (value === "mcp_assistant") {
    return "mcp_assistant";
  }
  return "website";
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
