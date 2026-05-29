import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import {
  adminText,
  followUpLabel,
  getAdminLocale,
  jobStatusLabel,
  langQuery,
  timeBlockStatusLabel
} from "@/lib/admin-i18n";
import type { ClientRow } from "@/lib/client-records";
import type { CrewMemberRow } from "@/lib/crew-records";
import type { FollowUpTaskRow, JobRow, TimeBlockRow } from "@/lib/operations-records";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Rosa Calendar",
  robots: {
    index: false,
    follow: false
  }
};

type CalendarPageProps = {
  searchParams?: Promise<{
    error?: string;
    blockCreated?: string;
    lang?: string;
    view?: string;
    date?: string;
  }>;
};

type CalendarView = "day" | "week" | "month";

type Activity = {
  id: string;
  at: string;
  label: string;
  detail: string;
  meta: string;
  kind: "job" | "follow-up" | "block";
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const locale = getAdminLocale(params?.lang);
  const t = adminText[locale];
  const view = getView(params?.view);
  const selectedDate = getSelectedDate(params?.date);
  const range = getRange(selectedDate, view);
  const previousDate = shiftDate(selectedDate, view, -1);
  const nextDate = shiftDate(selectedDate, view, 1);
  const cookieStore = await cookies();
  const authenticated = await verifyAdminSession(cookieStore.get(adminSessionCookie)?.value);

  if (!isAdminConfigured() || !authenticated) {
    return (
      <main className="admin-shell">
        <section className="admin-panel narrow">
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.signInRequired}</h1>
          <p className="admin-muted">
            <a href={`/admin${langQuery(locale)}`}>{t.returnLogin}</a>
          </p>
        </section>
      </main>
    );
  }

  let clients: ClientRow[] = [];
  let crew: CrewMemberRow[] = [];
  let jobs: JobRow[] = [];
  let tasks: FollowUpTaskRow[] = [];
  let blocks: TimeBlockRow[] = [];
  let loadError = "";

  if (isSupabaseServiceConfigured()) {
    try {
      [clients, crew, jobs, tasks, blocks] = await Promise.all([
        selectServiceRows<ClientRow>("clients", "select=*&order=name.asc&limit=200"),
        selectServiceRows<CrewMemberRow>("crew_members", "select=*&order=is_rosa.desc,name.asc&limit=100"),
        selectServiceRows<JobRow>("jobs", "select=*&order=scheduled_for.asc.nullslast&limit=200"),
        selectServiceRows<FollowUpTaskRow>("follow_up_tasks", "select=*&order=due_at.asc.nullslast&limit=200"),
        selectServiceRows<TimeBlockRow>("time_blocks", "select=*&order=start_at.asc&limit=200")
      ]);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Calendar could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  const clientNames = new Map(clients.map((client) => [client.id, client.name]));
  const crewNames = new Map(crew.map((member) => [member.id, member.name]));
  const activities = buildActivities(jobs, tasks, blocks, clientNames, crewNames, locale).filter((activity) =>
    isInRange(activity.at, range.start, range.end)
  );
  const visibleBlocks = blocks.filter((block) => overlaps(block.start_at, block.end_at, range.start, range.end));
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.calendarTitle}</h1>
          <p className="admin-muted">{t.calendarCopy}</p>
          <AdminNav locale={locale} current="calendar" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/calendar${buildQuery({ lang: nextLocale, view, date: selectedDate })}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.blockCreated ? <p className="admin-success">{t.blockSaved}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-calendar-shell">
        <section className="admin-panel admin-form">
          <div className="admin-panel-title">
            <h2>{formatRangeTitle(range.start, range.end, view, locale)}</h2>
            <a href={`/admin/calendar${buildQuery({ lang: locale, view, date: todayDate() })}`}>{t.today}</a>
          </div>
          <div className="admin-calendar-controls">
            <a className="button secondary compact" href={`/admin/calendar${buildQuery({ lang: locale, view, date: previousDate })}`}>
              {t.previous}
            </a>
            <form action="/admin/calendar" method="get">
              {locale === "en" ? <input name="lang" type="hidden" value="en" /> : null}
              <input name="view" type="hidden" value={view} />
              <label>
                <span className="sr-only">{t.goToDate}</span>
                <input aria-label={t.goToDate} name="date" type="date" defaultValue={selectedDate} />
              </label>
              <button className="button secondary compact" type="submit">
                {t.viewDate}
              </button>
            </form>
            <a className="button secondary compact" href={`/admin/calendar${buildQuery({ lang: locale, view, date: nextDate })}`}>
              {t.next}
            </a>
          </div>
          <div className="admin-segmented" aria-label={t.calendarTitle}>
            <a aria-current={view === "day" ? "page" : undefined} href={`/admin/calendar${buildQuery({ lang: locale, view: "day", date: selectedDate })}`}>
              {t.dayView}
            </a>
            <a aria-current={view === "week" ? "page" : undefined} href={`/admin/calendar${buildQuery({ lang: locale, view: "week", date: selectedDate })}`}>
              {t.weekView}
            </a>
            <a aria-current={view === "month" ? "page" : undefined} href={`/admin/calendar${buildQuery({ lang: locale, view: "month", date: selectedDate })}`}>
              {t.monthView}
            </a>
          </div>
          {view === "month" ? <MonthGrid rangeStart={range.start} activities={activities} locale={locale} /> : null}
          <div className="admin-list">
            <div className="admin-panel-title compact">
              <h2>{t.activities}</h2>
              <span>{activities.length}</span>
            </div>
            {activities.length === 0 ? (
              <p className="admin-muted">{t.noActivities}</p>
            ) : (
              activities.map((activity) => (
                <article className={`admin-list-row calendar-${activity.kind}`} key={`${activity.kind}-${activity.id}`}>
                  <div>
                    <strong>{activity.label}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span>{activity.meta}</span>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="admin-side-stack">
          <form className="admin-panel admin-form" action="/api/admin/time-blocks" method="post">
            <input name="lang" type="hidden" value={locale} />
            <input name="view" type="hidden" value={view} />
            <input name="date" type="hidden" value={selectedDate} />
            <h2>{t.blockTime}</h2>
            <label>
              {t.startTime}
              <input name="startAt" type="datetime-local" defaultValue={`${selectedDate}T12:00`} required />
            </label>
            <label>
              {t.endTime}
              <input name="endAt" type="datetime-local" defaultValue={`${selectedDate}T15:00`} required />
            </label>
            <label>
              {t.reason}
              <input name="reason" required />
            </label>
            <label>
              {t.status}
              <select name="status" defaultValue="blocked">
                <option value="blocked">{t.statusBlocked}</option>
                <option value="reserved">{t.statusReserved}</option>
              </select>
            </label>
            <label>
              {t.notes}
              <textarea name="notes" rows={3} />
            </label>
            <button className="button primary" type="submit">
              {t.saveBlock}
            </button>
          </form>

          <section className="admin-panel">
            <div className="admin-panel-title">
              <h2>{t.timeBlocks}</h2>
              <span>{visibleBlocks.length}</span>
            </div>
            <div className="admin-list">
              {visibleBlocks.length === 0 ? (
                <p className="admin-muted">{t.noBlocks}</p>
              ) : (
                visibleBlocks.map((block) => (
                  <article className="admin-list-row" key={block.id}>
                    <div>
                      <strong>{block.reason}</strong>
                      <p>
                        {formatDateTime(block.start_at, locale)} - {formatDateTime(block.end_at, locale)}
                      </p>
                    </div>
                    <span>{timeBlockStatusLabel(block.status, locale)}</span>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function MonthGrid({ rangeStart, activities, locale }: { rangeStart: Date; activities: Activity[]; locale: "es" | "en" }) {
  const days = Array.from({ length: daysInMonth(rangeStart) }, (_, index) => {
    const day = new Date(rangeStart);
    day.setUTCDate(index + 1);
    return day;
  });

  return (
    <div className="calendar-month">
      {days.map((day) => {
        const dateKey = toDateInput(day);
        const count = activities.filter((activity) => toDateInput(new Date(activity.at)) === dateKey).length;
        return (
          <div className="calendar-day" key={dateKey}>
            <strong>{new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { day: "numeric" }).format(day)}</strong>
            <span>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function buildActivities(
  jobs: JobRow[],
  tasks: FollowUpTaskRow[],
  blocks: TimeBlockRow[],
  clientNames: Map<string, string>,
  crewNames: Map<string, string>,
  locale: "es" | "en"
) {
  const t = adminText[locale];
  return [
    ...jobs
      .filter((job) => job.scheduled_for)
      .map((job) => ({
        id: job.id,
        at: job.scheduled_for || "",
        label: `${t.jobActivity}: ${clientNames.get(job.client_id) || job.service_type}`,
        detail: `${job.service_type} · ${jobStatusLabel(job.status, locale)} · ${job.crew_member_id ? crewNames.get(job.crew_member_id) || t.notSet : t.notSet}`,
        meta: formatDateTime(job.scheduled_for, locale),
        kind: "job" as const
      })),
    ...tasks
      .filter((task) => task.due_at)
      .map((task) => ({
        id: task.id,
        at: task.due_at || "",
        label: `${t.followUpActivity}: ${followUpLabel(task.task_type, locale)}`,
        detail: task.notes || t.noNotes,
        meta: formatDateTime(task.due_at, locale),
        kind: "follow-up" as const
      })),
    ...blocks.map((block) => ({
      id: block.id,
      at: block.start_at,
      label: `${t.blockActivity}: ${block.reason}`,
      detail: block.notes || timeBlockStatusLabel(block.status, locale),
      meta: formatDateTime(block.start_at, locale),
      kind: "block" as const
    }))
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function getView(value: string | undefined): CalendarView {
  return value === "week" || value === "month" ? value : "day";
}

function getSelectedDate(value: string | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? String(value) : todayDate();
}

function todayDate() {
  return toDateInput(new Date());
}

function shiftDate(dateInput: string, view: CalendarView, direction: -1 | 1) {
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  if (view === "week") {
    date.setUTCDate(date.getUTCDate() + direction * 7);
  } else if (view === "month") {
    date.setUTCMonth(date.getUTCMonth() + direction, 1);
  } else {
    date.setUTCDate(date.getUTCDate() + direction);
  }
  return toDateInput(date);
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRange(dateInput: string, view: CalendarView) {
  const start = new Date(`${dateInput}T00:00:00.000Z`);
  const end = new Date(start);

  if (view === "week") {
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    end.setUTCDate(start.getUTCDate() + 7);
  } else if (view === "month") {
    start.setUTCDate(1);
    end.setUTCMonth(start.getUTCMonth() + 1, 1);
  } else {
    end.setUTCDate(start.getUTCDate() + 1);
  }

  return { start, end };
}

function daysInMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
}

function isInRange(value: string, start: Date, end: Date) {
  const timestamp = new Date(value).getTime();
  return timestamp >= start.getTime() && timestamp < end.getTime();
}

function overlaps(startValue: string, endValue: string, start: Date, end: Date) {
  return new Date(startValue).getTime() < end.getTime() && new Date(endValue).getTime() > start.getTime();
}

function buildQuery({ lang, view, date }: { lang: "es" | "en"; view: CalendarView; date: string }) {
  const params = new URLSearchParams();
  if (lang === "en") {
    params.set("lang", "en");
  }
  params.set("view", view);
  params.set("date", date);
  return `?${params.toString()}`;
}

function formatRangeTitle(start: Date, end: Date, view: CalendarView, locale: "es" | "en") {
  const formatter = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  if (view === "day") {
    return formatter.format(start);
  }
  const last = new Date(end);
  last.setUTCDate(last.getUTCDate() - 1);
  return `${formatter.format(start)} - ${formatter.format(last)}`;
}

function formatDateTime(value: string | null, locale: "es" | "en") {
  if (!value) {
    return locale === "es" ? "Sin fecha" : "No date";
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value));
}
