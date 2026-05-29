import { normalizeUsPhone } from "./phone";

const frequencies = ["weekly", "every_2_weeks", "every_3_weeks", "monthly", "one_time", "custom", "unknown"] as const;
const statuses = ["active", "paused", "lost", "prospect"] as const;
const communicationChannels = ["email", "phone", "sms", "whatsapp"] as const;

export type ClientRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  zip_code: string | null;
  preferred_language: "en" | "es";
  preferred_communication_channel: (typeof communicationChannels)[number];
  cleaning_frequency: (typeof frequencies)[number];
  usual_day: string | null;
  usual_time: string | null;
  current_price_usd: number | null;
  status: (typeof statuses)[number];
  source: string;
  can_ask_for_review: boolean;
  can_ask_for_referral: boolean;
  notes: string | null;
};

export function parseClientPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const name = clean(input.name, 120);
  const phone = clean(input.phone, 40);
  const normalizedPhone = normalizeUsPhone(phone);
  const phoneE164 = normalizedPhone?.e164 || "";
  const email = clean(input.email, 180).toLowerCase();
  const address = clean(input.address, 260);
  const zipCode = clean(input.zipCode || input.zip_code, 10);
  const price = parseOptionalMoney(input.currentPriceUsd || input.current_price_usd);

  if (!name) {
    errors.push("Client name is required.");
  }

  if (!normalizedPhone) {
    errors.push("Phone must be a valid 10-digit US number.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email must be valid.");
  }

  if (zipCode && !/^\d{5}$/.test(zipCode)) {
    errors.push("ZIP code must be 5 digits.");
  }

  if (price === "invalid") {
    errors.push("Current price must be a positive number.");
  }

  const preferredLanguage = input.preferredLanguage === "es" || input.preferred_language === "es" ? "es" : "en";
  const preferredCommunicationChannel = allowed(
    input.preferredCommunicationChannel || input.preferred_communication_channel,
    communicationChannels,
    "email"
  );
  const cleaningFrequency = allowed(input.cleaningFrequency || input.cleaning_frequency, frequencies, "unknown");
  const status = allowed(input.status, statuses, "active");

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      name,
      phone: phoneE164,
      email: email || null,
      address: address || null,
      zip_code: zipCode || null,
      preferred_language: preferredLanguage,
      preferred_communication_channel: preferredCommunicationChannel,
      cleaning_frequency: cleaningFrequency,
      usual_day: clean(input.usualDay || input.usual_day, 40) || null,
      usual_time: clean(input.usualTime || input.usual_time, 40) || null,
      current_price_usd: price || null,
      status,
      source: clean(input.source, 80) || "existing_client",
      can_ask_for_review: toBoolean(input.canAskForReview || input.can_ask_for_review),
      can_ask_for_referral: toBoolean(input.canAskForReferral || input.can_ask_for_referral),
      notes: clean(input.notes, 1400) || null
    }
  };
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseOptionalMoney(value: unknown) {
  const cleaned = clean(value, 20).replace(/^\$/, "");
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "invalid";
  }

  return Number(parsed.toFixed(2));
}

function allowed<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  return values.includes(String(value) as T[number]) ? (String(value) as T[number]) : fallback;
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}
