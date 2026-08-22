import {
  persistAppointmentIntake,
  prepareAppointmentIntake,
  type AppointmentRow
} from "./appointment-intake";
import {
  containsSensitivePattern,
  countRecentAppointmentRequestsByPhone,
  enforceAppointmentRateLimit,
  isHoneypotTripped,
  validateRequestPhone,
  verifySharedSecret
} from "./mcp-abuse-protection";
import { checkServiceArea, type McpLanguage } from "./mcp-readonly-tools";

// GEN-001 TASK-009 — request_appointment write path for the agent-native MCP lane.
// Composes the abuse gate (TASK-008) and the shared intake (extraction) into one flow:
// honeypot -> shared secret -> phone -> ZIP in-area -> sensitive-notes guard -> throttle ->
// persist pending -> report pending_review.
// The assistant REQUESTS; it never confirms. status is always "pending_review" on success (RISK-005).
//
// PII minimization (OpenAI resubmission, 2026-08-22 finding): `secret` is NOT part of the public
// MCP tool schema (mcp-server.ts) — it is threaded in here only from a transport-level source
// (the /mcp route reads it off a request header, never a user-facing tool argument). This type
// still carries `secret` because this function is the shared write path used from that trusted
// caller; it must never be re-exposed as a tool input.

export type RequestAppointmentInput = {
  name: string;
  phone: string;
  address: string;
  zip: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  preferred_times: string[];
  notes?: string;
  language?: McpLanguage;
  honeypot?: string;
  secret?: string;
};

export type RequestAppointmentDeps = {
  now?: () => string;
  countRecent?: (args: { phoneE164: string; sinceIso: string }) => Promise<number>;
  persist?: (row: AppointmentRow) => Promise<{ id: string | null }>;
  sharedSecretExpected?: string;
};

export type RequestAppointmentRejectReason =
  | "honeypot"
  | "invalid_secret"
  | "invalid_phone"
  | "out_of_area"
  | "sensitive_notes"
  | "rate_limited"
  | "invalid_input";

export type RequestAppointmentResult =
  | { ok: true; request_id: string | null; status: "pending_review"; message: string }
  | { ok: false; reason: RequestAppointmentRejectReason; status: number; message: string };

export async function requestAppointment(
  input: RequestAppointmentInput,
  deps: RequestAppointmentDeps = {}
): Promise<RequestAppointmentResult> {
  const language: McpLanguage = input.language === "es" ? "es" : "en";
  const now = deps.now ?? (() => new Date().toISOString());
  const countRecent = deps.countRecent ?? countRecentAppointmentRequestsByPhone;
  const persist = deps.persist ?? persistAppointmentIntake;
  const sharedSecretExpected = deps.sharedSecretExpected ?? process.env.MCP_WRITE_SHARED_SECRET ?? "";

  // 1. Honeypot — a bot filled a field real users never see.
  if (isHoneypotTripped(input.honeypot)) {
    return reject("honeypot", 400, language);
  }

  // 2. Optional shared secret between the MCP layer and this write path.
  if (!verifySharedSecret(input.secret, sharedSecretExpected)) {
    return reject("invalid_secret", 401, language);
  }

  // 3. Phone validation (normalized to E.164 so the throttle key stays consistent).
  const phone = validateRequestPhone(input.phone);
  if (!phone.ok) {
    return reject("invalid_phone", 400, language);
  }

  // 4. Service area — validate the ZIP is in-area first, with a friendly bilingual message.
  const area = checkServiceArea({ zip: input.zip, language });
  if (!area.eligible) {
    return { ok: false, reason: "out_of_area", status: 400, message: area.message };
  }

  // 4b. Notes must be brief access/scheduling notes only — reject obvious sensitive patterns
  // (card numbers, SSNs) rather than soliciting or persisting them (RISK-012).
  if (containsSensitivePattern(input.notes)) {
    return reject("sensitive_notes", 400, language);
  }

  // 5. $0 Supabase per-phone throttle.
  const rate = await enforceAppointmentRateLimit({
    phoneE164: phone.e164,
    nowIso: now(),
    countRecent
  });
  if (!rate.allowed) {
    return reject("rate_limited", 429, language);
  }

  // 6. Shape the row through the single shared intake (source = mcp_assistant, DB status defaults to pending).
  const prepared = prepareAppointmentIntake({
    language,
    name: input.name,
    phone: phone.e164,
    address: input.address,
    zipCode: area.zip,
    serviceType: input.service_type,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    preferredTime1: input.preferred_times?.[0],
    preferredTime2: input.preferred_times?.[1] ?? input.preferred_times?.[0],
    preferredTime3: input.preferred_times?.[2] ?? input.preferred_times?.[1] ?? input.preferred_times?.[0],
    notes: input.notes,
    source: "mcp_assistant"
  });
  if (!prepared.ok) {
    return reject("invalid_input", prepared.status, language);
  }

  // 7. Persist the pending request and notify Rosa via the existing path.
  const { id } = await persist(prepared.row);

  // 8. Report a REQUEST, never a confirmation.
  return { ok: true, request_id: id, status: "pending_review", message: successMessage(language) };
}

function reject(
  reason: RequestAppointmentRejectReason,
  status: number,
  language: McpLanguage
): RequestAppointmentResult {
  return { ok: false, reason, status, message: rejectMessage(reason, language) };
}

function successMessage(language: McpLanguage): string {
  return language === "es"
    ? "Solicitud enviada. Rosa revisará tu dirección y horarios y te contactará para confirmar. Esto no confirma la cita."
    : "Request sent. Rosa will review your address and preferred times and contact you to confirm. This does not confirm the appointment.";
}

function rejectMessage(reason: RequestAppointmentRejectReason, language: McpLanguage): string {
  const messages: Record<RequestAppointmentRejectReason, { en: string; es: string }> = {
    honeypot: {
      en: "We couldn't process that request.",
      es: "No pudimos procesar esa solicitud."
    },
    invalid_secret: {
      en: "This request is not authorized.",
      es: "Esta solicitud no está autorizada."
    },
    invalid_phone: {
      en: "Please share a valid US phone number so Rosa can reach you.",
      es: "Comparte un número de teléfono válido de EE. UU. para que Rosa pueda contactarte."
    },
    out_of_area: {
      en: "This ZIP appears outside the service area. Rosa can review it manually.",
      es: "Este ZIP parece estar fuera del área de servicio. Rosa puede revisarlo manualmente."
    },
    sensitive_notes: {
      en: "Notes should only cover access or scheduling details. Please remove any card, SSN, health, or payment information and try again.",
      es: "Las notas deben ser solo sobre acceso u horarios. Elimina cualquier número de tarjeta, SSN, o información de salud o pago e inténtalo de nuevo."
    },
    rate_limited: {
      en: "We've received several requests from this number recently. Rosa will follow up — please avoid resending.",
      es: "Hemos recibido varias solicitudes de este número recientemente. Rosa dará seguimiento; evita reenviar."
    },
    invalid_input: {
      en: "Some appointment details were missing or invalid. Please check and try again.",
      es: "Faltan datos de la cita o son inválidos. Revísalos e inténtalo de nuevo."
    }
  };

  return messages[reason][language];
}
