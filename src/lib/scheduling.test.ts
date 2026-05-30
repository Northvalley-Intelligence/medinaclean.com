import { describe, expect, it } from "vitest";
import {
  applyClientPreferredTime,
  buildAttentionTasks,
  getNextRecurringDate,
  planNextRecurringJob,
  shouldCreateNextJob
} from "./scheduling";

const client = {
  id: "client-1",
  name: "Maria Smith",
  status: "active",
  cleaning_frequency: "every_2_weeks",
  preferred_communication_channel: "email"
};

describe("scheduling", () => {
  it("calculates the next recurring date from cleaning frequency", () => {
    expect(getNextRecurringDate("2026-06-01T13:00:00.000Z", "weekly")).toBe("2026-06-08T13:00:00.000Z");
    expect(getNextRecurringDate("2026-06-01T13:00:00.000Z", "every_2_weeks")).toBe("2026-06-15T13:00:00.000Z");
    expect(getNextRecurringDate("2026-06-01T13:00:00.000Z", "every_3_weeks")).toBe("2026-06-22T13:00:00.000Z");
    expect(getNextRecurringDate("2026-01-31T13:00:00.000Z", "monthly")).toBe("2026-02-28T13:00:00.000Z");
  });

  it("does not create recurring jobs for one-time, custom, unknown, paused, or lost clients", () => {
    expect(shouldCreateNextJob({ ...client, cleaning_frequency: "one_time" }, [])).toBe(false);
    expect(shouldCreateNextJob({ ...client, cleaning_frequency: "custom" }, [])).toBe(false);
    expect(shouldCreateNextJob({ ...client, cleaning_frequency: "unknown" }, [])).toBe(false);
    expect(shouldCreateNextJob({ ...client, status: "paused" }, [])).toBe(false);
    expect(shouldCreateNextJob({ ...client, status: "lost" }, [])).toBe(false);
  });

  it("does not create a duplicate next job when an upcoming job exists", () => {
    expect(
      shouldCreateNextJob(client, [
        {
          id: "job-2",
          client_id: "client-1",
          scheduled_for: "2026-06-15T13:00:00.000Z",
          status: "scheduled"
        }
      ])
    ).toBe(false);
  });

  it("plans the next recurring job from the latest completed job", () => {
    expect(
      planNextRecurringJob(client, [
        {
          id: "job-1",
          client_id: "client-1",
          scheduled_for: "2026-06-01T13:00:00.000Z",
          estimated_duration_minutes: 180,
          service_type: "Recurring cleaning",
          status: "completed",
          price_usd: 150
        }
      ])
    ).toEqual({
      client_id: "client-1",
      scheduled_for: "2026-06-15T13:00:00.000Z",
      estimated_duration_minutes: 180,
      service_type: "Recurring cleaning",
      status: "needs_confirmation",
      calendar_invite_status: "not_sent",
      price_usd: 150,
      notes: "Auto-planned from recurring schedule."
    });
  });

  it("plans a first recurring job from client defaults when no completed job exists", () => {
    expect(
      planNextRecurringJob(
        { ...client, usual_time: "Morning", current_price_usd: 150 },
        [],
        new Date("2026-06-01T14:00:00.000Z")
      )
    ).toEqual({
      client_id: "client-1",
      scheduled_for: "2026-06-15T10:00:00.000Z",
      estimated_duration_minutes: null,
      service_type: "Recurring cleaning",
      status: "needs_confirmation",
      calendar_invite_status: "not_sent",
      price_usd: 150,
      notes: "Auto-planned from recurring schedule."
    });
  });

  it("translates client preferred time labels into concrete scheduling times", () => {
    expect(applyClientPreferredTime("2026-06-15T13:00:00.000Z", "Morning")).toBe("2026-06-15T10:00:00.000Z");
    expect(applyClientPreferredTime("2026-06-15T13:00:00.000Z", "mañana")).toBe("2026-06-15T10:00:00.000Z");
    expect(applyClientPreferredTime("2026-06-15T10:00:00.000Z", "Afternoon")).toBe("2026-06-15T13:00:00.000Z");
    expect(applyClientPreferredTime("2026-06-15T10:00:00.000Z", "10:30")).toBe("2026-06-15T10:30:00.000Z");
    expect(applyClientPreferredTime("2026-06-15T10:00:00.000Z", "No preference")).toBe("2026-06-15T10:00:00.000Z");
  });

  it("uses client preferred time when planning recurring jobs", () => {
    expect(
      planNextRecurringJob({ ...client, usual_time: "Morning" }, [
        {
          id: "job-1",
          client_id: "client-1",
          scheduled_for: "2026-06-01T13:00:00.000Z",
          estimated_duration_minutes: 180,
          service_type: "Recurring cleaning",
          status: "completed",
          price_usd: 150
        }
      ])?.scheduled_for
    ).toBe("2026-06-15T10:00:00.000Z");
  });

  it("builds attention tasks for review approvals, unconfirmed jobs, and missing recurring jobs", () => {
    const tasks = buildAttentionTasks({
      now: new Date("2026-06-10T14:00:00.000Z"),
      clients: [client, { ...client, id: "client-2", name: "Ana Lopez" }],
      jobs: [
        {
          id: "job-1",
          client_id: "client-1",
          scheduled_for: "2026-06-11T13:00:00.000Z",
          status: "invite_sent"
        }
      ],
      reviews: [{ id: "review-1", name: "Ana", status: "pending", created_at: "2026-06-10T10:00:00.000Z" }]
    });

    expect(tasks).toEqual([
      expect.objectContaining({ id: "review-review-1", type: "review_approval", priority: "high" }),
      expect.objectContaining({ id: "job-confirm-job-1", type: "job_confirmation", priority: "high" }),
      expect.objectContaining({ id: "client-next-job-client-2", type: "next_job_needed", priority: "medium" })
    ]);
  });
});
