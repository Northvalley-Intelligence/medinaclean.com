type ClientLike = {
  id: string;
  name: string;
  status: string;
  cleaning_frequency: string;
  preferred_communication_channel?: string | null;
  usual_time?: string | null;
};

type JobLike = {
  id: string;
  client_id: string;
  scheduled_for: string | null;
  status: string;
  estimated_duration_minutes?: number | null;
  service_type?: string;
  price_usd?: number | null;
};

type ReviewLike = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

export type AttentionTask = {
  id: string;
  type: "review_approval" | "job_confirmation" | "next_job_needed";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
  due_at: string | null;
  subject_id: string;
};

const recurringFrequencies = ["weekly", "every_2_weeks", "every_3_weeks", "monthly"] as const;
const activeJobStatuses = ["scheduled", "needs_confirmation", "invite_sent", "confirmed", "reschedule_needed"] as const;

export function getNextRecurringDate(value: string, frequency: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
  } else if (frequency === "every_2_weeks") {
    date.setUTCDate(date.getUTCDate() + 14);
  } else if (frequency === "every_3_weeks") {
    date.setUTCDate(date.getUTCDate() + 21);
  } else if (frequency === "monthly") {
    addOneMonthClamped(date);
  } else {
    return null;
  }

  return date.toISOString();
}

export function shouldCreateNextJob(client: ClientLike, jobs: JobLike[]) {
  if (!isRecurring(client.cleaning_frequency) || !["active", "prospect"].includes(client.status)) {
    return false;
  }

  return !jobs.some((job) => job.client_id === client.id && isActiveJobStatus(job.status) && job.scheduled_for);
}

export function planNextRecurringJob(client: ClientLike, jobs: JobLike[]) {
  if (!shouldCreateNextJob(client, jobs)) {
    return null;
  }

  const lastCompletedJob = jobs
    .filter((job) => job.client_id === client.id && job.status === "completed" && job.scheduled_for)
    .sort((a, b) => new Date(b.scheduled_for || "").getTime() - new Date(a.scheduled_for || "").getTime())[0];

  if (!lastCompletedJob?.scheduled_for) {
    return null;
  }

  const nextDate = getNextRecurringDate(lastCompletedJob.scheduled_for, client.cleaning_frequency);
  if (!nextDate) {
    return null;
  }

  return {
    client_id: client.id,
    scheduled_for: applyClientPreferredTime(nextDate, client.usual_time),
    estimated_duration_minutes: lastCompletedJob.estimated_duration_minutes ?? null,
    service_type: lastCompletedJob.service_type || "Recurring cleaning",
    status: "needs_confirmation",
    calendar_invite_status: "not_sent",
    price_usd: lastCompletedJob.price_usd ?? null,
    notes: "Auto-planned from recurring schedule."
  };
}

export function applyClientPreferredTime(dateIso: string, usualTime: string | null | undefined) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  const parsed = parsePreferredTime(usualTime);
  if (!parsed) {
    return date.toISOString();
  }

  date.setUTCHours(parsed.hour, parsed.minute, 0, 0);
  return date.toISOString();
}

export function buildAttentionTasks({
  now,
  clients,
  jobs,
  reviews
}: {
  now: Date;
  clients: ClientLike[];
  jobs: JobLike[];
  reviews: ReviewLike[];
}) {
  const tasks: AttentionTask[] = [];
  const clientsById = new Map(clients.map((client) => [client.id, client]));

  for (const review of reviews) {
    if (review.status === "pending") {
      tasks.push({
        id: `review-${review.id}`,
        type: "review_approval",
        priority: "high",
        title: `Review from ${review.name}`,
        detail: "Needs approval before it appears on the website.",
        href: "/admin/reviews",
        due_at: review.created_at,
        subject_id: review.id
      });
    }
  }

  for (const job of jobs) {
    const client = clientsById.get(job.client_id);
    if (!client || !job.scheduled_for) {
      continue;
    }

    const hoursUntilJob = (new Date(job.scheduled_for).getTime() - now.getTime()) / 36e5;
    if (["needs_confirmation", "invite_sent", "scheduled"].includes(job.status) && hoursUntilJob >= 0 && hoursUntilJob <= 72) {
      tasks.push({
        id: `job-confirm-${job.id}`,
        type: "job_confirmation",
        priority: hoursUntilJob <= 24 ? "high" : "medium",
        title: `${client.name} needs confirmation`,
        detail: `Upcoming cleaning is ${job.status.replaceAll("_", " ")}.`,
        href: `/admin/clients/${client.id}`,
        due_at: job.scheduled_for,
        subject_id: job.id
      });
    }
  }

  for (const client of clients) {
    if (shouldCreateNextJob(client, jobs)) {
      tasks.push({
        id: `client-next-job-${client.id}`,
        type: "next_job_needed",
        priority: "medium",
        title: `${client.name} needs the next cleaning planned`,
        detail: `Frequency is ${client.cleaning_frequency.replaceAll("_", " ")}.`,
        href: `/admin/clients/${client.id}`,
        due_at: null,
        subject_id: client.id
      });
    }
  }

  return tasks.sort(compareTasks);
}

function addOneMonthClamped(date: Date) {
  const originalDay = date.getUTCDate();
  const targetMonth = date.getUTCMonth() + 1;
  date.setUTCDate(1);
  date.setUTCMonth(targetMonth);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
}

function isRecurring(value: string): value is (typeof recurringFrequencies)[number] {
  return recurringFrequencies.includes(value as (typeof recurringFrequencies)[number]);
}

function parsePreferredTime(value: string | null | undefined) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized || /no preference|any|flexible|cualquier|sin preferencia/.test(normalized)) {
    return null;
  }

  if (/morning|mañana|manana|am/.test(normalized)) {
    return { hour: 10, minute: 0 };
  }

  if (/afternoon|tarde|pm/.test(normalized)) {
    return { hour: 13, minute: 0 };
  }

  const explicit = normalized.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\b/);
  if (explicit) {
    return {
      hour: Number(explicit[1]),
      minute: explicit[2] ? Number(explicit[2]) : 0
    };
  }

  return null;
}

function isActiveJobStatus(value: string) {
  return activeJobStatuses.includes(value as (typeof activeJobStatuses)[number]);
}

function compareTasks(a: AttentionTask, b: AttentionTask) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  if (priorityRank[a.priority] !== priorityRank[b.priority]) {
    return priorityRank[a.priority] - priorityRank[b.priority];
  }

  if (!a.due_at && !b.due_at) {
    return a.title.localeCompare(b.title);
  }

  if (!a.due_at) {
    return 1;
  }

  if (!b.due_at) {
    return -1;
  }

  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}
