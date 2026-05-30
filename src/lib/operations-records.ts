const jobStatuses = [
  "scheduled",
  "needs_confirmation",
  "invite_sent",
  "confirmed",
  "completed",
  "cancelled",
  "reschedule_needed"
] as const;
const calendarInviteStatuses = ["not_sent", "needs_action", "accepted", "declined", "tentative"] as const;
const taskTypes = ["confirm_next_cleaning", "ask_for_review", "ask_for_referral", "recurring_offer", "manual"] as const;
const taskStatuses = ["open", "done", "dismissed"] as const;
const timeBlockStatuses = ["blocked", "reserved"] as const;

export type JobRow = {
  id: string;
  created_at: string;
  client_id: string;
  crew_member_id: string | null;
  scheduled_for: string | null;
  estimated_duration_minutes: number | null;
  service_type: string;
  status: (typeof jobStatuses)[number];
  google_calendar_event_id: string | null;
  calendar_invite_status: (typeof calendarInviteStatuses)[number];
  last_invite_sent_at: string | null;
  price_usd: number | null;
  notes: string | null;
};

export type FollowUpTaskRow = {
  id: string;
  created_at: string;
  client_id: string | null;
  job_id: string | null;
  due_at: string | null;
  task_type: (typeof taskTypes)[number];
  status: (typeof taskStatuses)[number];
  notes: string | null;
};

export type TimeBlockRow = {
  id: string;
  created_at: string;
  start_at: string;
  end_at: string;
  reason: string;
  status: (typeof timeBlockStatuses)[number];
  notes: string | null;
};

export function parseJobPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const clientId = clean(input.clientId || input.client_id, 80);
  const crewMemberId = clean(input.crewMemberId || input.crew_member_id, 80);
  const scheduledFor = parseOptionalDate(input.scheduledFor || input.scheduled_for);
  const duration = parseOptionalInteger(input.estimatedDurationMinutes || input.estimated_duration_minutes);
  const price = parseOptionalMoney(input.priceUsd || input.price_usd);
  const inviteStatusValue = input.calendarInviteStatus || input.calendar_invite_status;
  const inviteStatus = allowedOrInvalid(inviteStatusValue, calendarInviteStatuses, "not_sent");

  if (!isUuid(clientId)) {
    errors.push("Client id is required.");
  }

  if (crewMemberId && !isUuid(crewMemberId)) {
    errors.push("Crew member id must be valid.");
  }

  if (scheduledFor === "invalid") {
    errors.push("Scheduled date must be valid.");
  }

  if (duration === "invalid" || (typeof duration === "number" && (duration < 30 || duration > 1440))) {
    errors.push("Duration must be between 30 and 1440 minutes.");
  }

  if (price === "invalid") {
    errors.push("Price must be a positive number.");
  }

  if (inviteStatus === "invalid") {
    errors.push("Calendar invite status must be valid.");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      client_id: clientId,
      crew_member_id: crewMemberId || null,
      scheduled_for: scheduledFor,
      estimated_duration_minutes: duration,
      service_type: clean(input.serviceType || input.service_type, 120) || "recurring_cleaning",
      status: allowed(input.status, jobStatuses, "scheduled"),
      google_calendar_event_id: clean(input.googleCalendarEventId || input.google_calendar_event_id, 180) || null,
      calendar_invite_status: inviteStatus,
      last_invite_sent_at: parseOptionalDate(input.lastInviteSentAt || input.last_invite_sent_at),
      price_usd: price,
      notes: clean(input.notes, 1400) || null
    }
  };
}

export function parseFollowUpPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const clientId = clean(input.clientId || input.client_id, 80);
  const jobId = clean(input.jobId || input.job_id, 80);
  const dueAt = parseOptionalDate(input.dueAt || input.due_at);

  if (!isUuid(clientId)) {
    errors.push("Client id is required.");
  }

  if (jobId && !isUuid(jobId)) {
    errors.push("Job id must be valid.");
  }

  if (dueAt === "invalid") {
    errors.push("Due date must be valid.");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      client_id: clientId,
      job_id: jobId || null,
      due_at: dueAt,
      task_type: allowed(input.taskType || input.task_type, taskTypes, "manual"),
      status: allowed(input.status, taskStatuses, "open"),
      notes: clean(input.notes, 1400) || null
    }
  };
}

export function parseTimeBlockPayload(input: Record<string, unknown>) {
  const errors: string[] = [];
  const startAt = parseRequiredDate(input.startAt || input.start_at);
  const endAt = parseRequiredDate(input.endAt || input.end_at);

  if (startAt === "invalid") {
    errors.push("Start time must be valid.");
  }

  if (endAt === "invalid") {
    errors.push("End time must be valid.");
  }

  if (
    startAt !== "invalid" &&
    endAt !== "invalid" &&
    startAt &&
    endAt &&
    new Date(endAt).getTime() <= new Date(startAt).getTime()
  ) {
    errors.push("End time must be after start time.");
  }

  if (errors.length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    row: {
      start_at: startAt,
      end_at: endAt,
      reason: clean(input.reason, 160) || "Blocked time",
      status: allowed(input.status, timeBlockStatuses, "blocked"),
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

function parseRequiredDate(value: unknown) {
  const parsed = parseOptionalDate(value);
  return parsed || "invalid";
}

function parseOptionalDate(value: unknown) {
  const cleaned = clean(value, 80);
  if (!cleaned) {
    return null;
  }

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed.toISOString();
}

function parseOptionalInteger(value: unknown) {
  const cleaned = clean(value, 10);
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isInteger(parsed) ? parsed : "invalid";
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

function allowedOrInvalid<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  const cleaned = String(value || "");
  if (!cleaned) {
    return fallback;
  }

  return values.includes(cleaned as T[number]) ? (cleaned as T[number]) : "invalid";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
