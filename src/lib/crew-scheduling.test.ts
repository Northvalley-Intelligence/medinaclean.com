import { describe, expect, it } from "vitest";
import { canCrewTakeJob, chooseCrewMemberForJob, hasCrewConflict } from "./crew-scheduling";
import type { CrewMemberRow, CrewUnavailabilityRow } from "./crew-records";
import type { JobRow } from "./operations-records";

const crew: CrewMemberRow[] = [
  member("rosa", "Rosa Medina", true),
  member("ana", "Ana Gomez"),
  member("luz", "Luz Perez")
];

describe("crew-scheduling", () => {
  it("chooses the available crew member with the fewest active allocations", () => {
    const result = chooseCrewMemberForJob({
      crewMembers: crew,
      jobs: [
        job("job-1", "rosa", "2026-06-15T14:00:00.000Z"),
        job("job-2", "ana", "2026-06-16T14:00:00.000Z")
      ],
      unavailability: [],
      scheduledFor: "2026-06-17T14:00:00.000Z",
      durationMinutes: 180
    });

    expect(result?.id).toBe("luz");
  });

  it("does not assign a crew member who is unavailable during the job", () => {
    const result = chooseCrewMemberForJob({
      crewMembers: crew,
      jobs: [],
      unavailability: [
        unavailable("luz", "2026-06-17T13:00:00.000Z", "2026-06-17T18:00:00.000Z"),
        unavailable("ana", "2026-06-17T09:00:00.000Z", "2026-06-17T18:00:00.000Z")
      ],
      scheduledFor: "2026-06-17T14:00:00.000Z",
      durationMinutes: 180
    });

    expect(result?.id).toBe("rosa");
  });

  it("treats weekdays 10am-5pm as default crew availability", () => {
    const weekday = chooseCrewMemberForJob({
      crewMembers: crew,
      jobs: [],
      unavailability: [],
      scheduledFor: "2026-06-17T15:00:00.000Z",
      durationMinutes: 60
    });
    const evening = chooseCrewMemberForJob({
      crewMembers: crew,
      jobs: [],
      unavailability: [],
      scheduledFor: "2026-06-17T22:30:00.000Z",
      durationMinutes: 60
    });
    const weekend = chooseCrewMemberForJob({
      crewMembers: crew,
      jobs: [],
      unavailability: [],
      scheduledFor: "2026-06-20T15:00:00.000Z",
      durationMinutes: 60
    });

    expect(weekday?.id).toBe("rosa");
    expect(evening).toBeNull();
    expect(weekend).toBeNull();
  });

  it("requires a one-hour buffer before and after existing jobs for the same crew member", () => {
    const existing = job("job-1", "rosa", "2026-06-17T14:00:00.000Z", 180);

    expect(
      hasCrewConflict({
        crewMemberId: "rosa",
        scheduledFor: "2026-06-17T17:30:00.000Z",
        durationMinutes: 60,
        jobs: [existing],
        unavailability: []
      })
    ).toBe(true);
    expect(
      hasCrewConflict({
        crewMemberId: "rosa",
        scheduledFor: "2026-06-17T18:00:00.000Z",
        durationMinutes: 60,
        jobs: [existing],
        unavailability: []
      })
    ).toBe(false);
  });

  it("validates a manually selected crew member against default availability and conflicts", () => {
    expect(
      canCrewTakeJob({
        crewMember: crew[0],
        jobs: [],
        unavailability: [],
        scheduledFor: "2026-06-17T15:00:00.000Z",
        durationMinutes: 60
      })
    ).toBe(true);
    expect(
      canCrewTakeJob({
        crewMember: crew[0],
        jobs: [],
        unavailability: [unavailable("rosa", "2026-06-17T14:00:00.000Z", "2026-06-17T16:00:00.000Z")],
        scheduledFor: "2026-06-17T15:00:00.000Z",
        durationMinutes: 60
      })
    ).toBe(false);
    expect(
      canCrewTakeJob({
        crewMember: crew[0],
        jobs: [],
        unavailability: [],
        scheduledFor: "2026-06-20T15:00:00.000Z",
        durationMinutes: 60
      })
    ).toBe(false);
  });
});

function member(id: string, name: string, isRosa = false): CrewMemberRow {
  return {
    id,
    created_at: "2026-05-29T00:00:00.000Z",
    updated_at: "2026-05-29T00:00:00.000Z",
    name,
    phone: null,
    email: null,
    role: isRosa ? "owner" : "cleaner",
    status: "active",
    is_rosa: isRosa,
    default_weekday_start: "10:00",
    default_weekday_end: "17:00",
    notes: null
  };
}

function job(id: string, crewMemberId: string, scheduledFor: string, durationMinutes = 180): JobRow {
  return {
    id,
    created_at: "2026-05-29T00:00:00.000Z",
    client_id: "client-1",
    crew_member_id: crewMemberId,
    scheduled_for: scheduledFor,
    estimated_duration_minutes: durationMinutes,
    service_type: "Recurring cleaning",
    status: "scheduled",
    google_calendar_event_id: null,
    calendar_invite_status: "not_sent",
    last_invite_sent_at: null,
    price_usd: null,
    notes: null
  };
}

function unavailable(crewMemberId: string, startAt: string, endAt: string): CrewUnavailabilityRow {
  return {
    id: `${crewMemberId}-${startAt}`,
    created_at: "2026-05-29T00:00:00.000Z",
    crew_member_id: crewMemberId,
    start_at: startAt,
    end_at: endAt,
    reason: "Unavailable",
    notes: null
  };
}
