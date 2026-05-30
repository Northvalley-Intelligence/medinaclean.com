import { describe, expect, it } from "vitest";
import { parseFollowUpPayload, parseJobPayload, parseTimeBlockPayload } from "./operations-records";

describe("operations-records", () => {
  it("maps a scheduled job form to a Supabase row", () => {
    const result = parseJobPayload({
      clientId: "9b9a4b16-e6fb-4f50-9dcf-cf70e7338216",
      scheduledFor: "2026-06-01T14:30Z",
      estimatedDurationMinutes: "180",
      serviceType: "Deep cleaning",
      status: "invite_sent",
      priceUsd: "$175.50",
      googleCalendarEventId: "event-123",
      calendarInviteStatus: "needs_action",
      notes: "Bring stainless cleaner"
    });

    expect(result).toEqual({
      ok: true,
      row: {
        client_id: "9b9a4b16-e6fb-4f50-9dcf-cf70e7338216",
        crew_member_id: null,
        scheduled_for: "2026-06-01T14:30:00.000Z",
        estimated_duration_minutes: 180,
        service_type: "Deep cleaning",
        status: "invite_sent",
        google_calendar_event_id: "event-123",
        calendar_invite_status: "needs_action",
        last_invite_sent_at: null,
        price_usd: 175.5,
        notes: "Bring stainless cleaner"
      }
    });
  });

  it("rejects invalid job payloads", () => {
    const result = parseJobPayload({
      clientId: "not-a-uuid",
      crewMemberId: "bad-crew",
      scheduledFor: "not-a-date",
      estimatedDurationMinutes: "2000",
      priceUsd: "-5",
      calendarInviteStatus: "bad"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Client id is required.");
      expect(result.errors).toContain("Crew member id must be valid.");
      expect(result.errors).toContain("Scheduled date must be valid.");
      expect(result.errors).toContain("Duration must be between 30 and 1440 minutes.");
      expect(result.errors).toContain("Price must be a positive number.");
      expect(result.errors).toContain("Calendar invite status must be valid.");
    }
  });

  it("maps a follow-up task form to a Supabase row", () => {
    const result = parseFollowUpPayload({
      clientId: "9b9a4b16-e6fb-4f50-9dcf-cf70e7338216",
      jobId: "cb6c18de-80f8-4a4d-988f-e66ad38455bb",
      dueAt: "2026-06-02T09:00Z",
      taskType: "ask_for_review",
      notes: "Ask after first cleaning"
    });

    expect(result).toEqual({
      ok: true,
      row: {
        client_id: "9b9a4b16-e6fb-4f50-9dcf-cf70e7338216",
        job_id: "cb6c18de-80f8-4a4d-988f-e66ad38455bb",
        due_at: "2026-06-02T09:00:00.000Z",
        task_type: "ask_for_review",
        status: "open",
        notes: "Ask after first cleaning"
      }
    });
  });

  it("rejects invalid follow-up task payloads", () => {
    const result = parseFollowUpPayload({
      clientId: "",
      dueAt: "not-a-date",
      taskType: "bad"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Client id is required.");
      expect(result.errors).toContain("Due date must be valid.");
    }
  });

  it("maps a time block form to a Supabase row", () => {
    const result = parseTimeBlockPayload({
      startAt: "2026-06-03T13:00Z",
      endAt: "2026-06-03T16:00Z",
      reason: "Doctor",
      status: "blocked",
      notes: "No appointments"
    });

    expect(result).toEqual({
      ok: true,
      row: {
        start_at: "2026-06-03T13:00:00.000Z",
        end_at: "2026-06-03T16:00:00.000Z",
        reason: "Doctor",
        status: "blocked",
        notes: "No appointments"
      }
    });
  });

  it("rejects invalid time blocks", () => {
    const result = parseTimeBlockPayload({
      startAt: "2026-06-03T16:00Z",
      endAt: "2026-06-03T13:00Z"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("End time must be after start time.");
    }
  });
});
