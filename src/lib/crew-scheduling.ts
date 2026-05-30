import type { CrewMemberRow, CrewUnavailabilityRow } from "./crew-records";
import type { JobRow } from "./operations-records";

const activeJobStatuses = ["scheduled", "needs_confirmation", "invite_sent", "confirmed", "reschedule_needed"] as const;
const bufferMinutes = 60;

type ChooseCrewInput = {
  crewMembers: CrewMemberRow[];
  jobs: JobRow[];
  unavailability: CrewUnavailabilityRow[];
  scheduledFor: string | null;
  durationMinutes: number | null;
};

type CanCrewInput = {
  crewMember: CrewMemberRow;
  jobs: JobRow[];
  unavailability: CrewUnavailabilityRow[];
  scheduledFor: string | null;
  durationMinutes: number | null;
};

type ConflictInput = {
  crewMemberId: string;
  scheduledFor: string;
  durationMinutes: number | null;
  jobs: JobRow[];
  unavailability: CrewUnavailabilityRow[];
};

export function chooseCrewMemberForJob(input: ChooseCrewInput) {
  if (!input.scheduledFor) {
    return null;
  }

  const activeCrew = input.crewMembers
    .filter((member) => member.status === "active")
    .sort((a, b) => Number(b.is_rosa) - Number(a.is_rosa) || a.name.localeCompare(b.name));

  const candidates = activeCrew.filter((member) =>
    canCrewTakeJob({
      crewMember: member,
      jobs: input.jobs,
      unavailability: input.unavailability,
      scheduledFor: input.scheduledFor,
      durationMinutes: input.durationMinutes
    })
  );

  if (candidates.length === 0) {
    return null;
  }

  const allocationCounts = new Map<string, number>();
  for (const job of input.jobs) {
    if (job.crew_member_id && activeJobStatuses.includes(job.status as (typeof activeJobStatuses)[number])) {
      allocationCounts.set(job.crew_member_id, (allocationCounts.get(job.crew_member_id) || 0) + 1);
    }
  }

  return candidates.sort((a, b) => {
    const allocationDelta = (allocationCounts.get(a.id) || 0) - (allocationCounts.get(b.id) || 0);
    return allocationDelta || Number(b.is_rosa) - Number(a.is_rosa) || a.name.localeCompare(b.name);
  })[0];
}

export function canCrewTakeJob(input: CanCrewInput) {
  if (!input.scheduledFor || input.crewMember.status !== "active") {
    return false;
  }

  return (
    isInsideDefaultAvailability(input.crewMember, input.scheduledFor, input.durationMinutes) &&
    !hasCrewConflict({
      crewMemberId: input.crewMember.id,
      scheduledFor: input.scheduledFor,
      durationMinutes: input.durationMinutes,
      jobs: input.jobs,
      unavailability: input.unavailability
    })
  );
}

export function hasCrewConflict(input: ConflictInput) {
  const requested = getBufferedRange(input.scheduledFor, input.durationMinutes);

  const jobConflict = input.jobs.some((job) => {
    if (job.crew_member_id !== input.crewMemberId || !job.scheduled_for) {
      return false;
    }

    if (!activeJobStatuses.includes(job.status as (typeof activeJobStatuses)[number])) {
      return false;
    }

    return overlaps(requested.start, requested.end, ...getJobRange(job));
  });

  if (jobConflict) {
    return true;
  }

  return input.unavailability.some(
    (entry) =>
      entry.crew_member_id === input.crewMemberId &&
      overlaps(new Date(input.scheduledFor), getJobEnd(input.scheduledFor, input.durationMinutes), new Date(entry.start_at), new Date(entry.end_at))
  );
}

function isInsideDefaultAvailability(member: CrewMemberRow, scheduledFor: string, durationMinutes: number | null) {
  const start = new Date(scheduledFor);
  const end = getJobEnd(scheduledFor, durationMinutes);
  const day = start.getUTCDay();
  if (day === 0 || day === 6 || end.getUTCDate() !== start.getUTCDate()) {
    return false;
  }

  const [startHour, startMinute] = member.default_weekday_start.split(":").map(Number);
  const [endHour, endMinute] = member.default_weekday_end.split(":").map(Number);
  const availableStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), startHour, startMinute || 0);
  const availableEnd = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), endHour, endMinute || 0);

  return start.getTime() >= availableStart && end.getTime() <= availableEnd;
}

function getBufferedRange(scheduledFor: string, durationMinutes: number | null) {
  const start = new Date(scheduledFor);
  const end = getJobEnd(scheduledFor, durationMinutes);
  return {
    start: new Date(start.getTime() - bufferMinutes * 60 * 1000),
    end: new Date(end.getTime() + bufferMinutes * 60 * 1000)
  };
}

function getJobRange(job: JobRow): [Date, Date] {
  const start = new Date(job.scheduled_for || "");
  return [start, getJobEnd(job.scheduled_for || "", job.estimated_duration_minutes)];
}

function getJobEnd(scheduledFor: string, durationMinutes: number | null) {
  const minutes = durationMinutes || 180;
  return new Date(new Date(scheduledFor).getTime() + minutes * 60 * 1000);
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}
