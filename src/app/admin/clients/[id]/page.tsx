import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import {
  adminText,
  followUpLabel,
  frequencyLabel,
  getAdminLocale,
  jobStatusLabel,
  langQuery
} from "@/lib/admin-i18n";
import type { ClientRow } from "@/lib/client-records";
import type { CrewMemberRow } from "@/lib/crew-records";
import type { FollowUpTaskRow, JobRow } from "@/lib/operations-records";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Client Details",
  robots: {
    index: false,
    follow: false
  }
};

type ClientPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    jobCreated?: string;
    followUpCreated?: string;
    statusUpdated?: string;
    inviteSent?: string;
    lang?: string;
  }>;
};

export default async function ClientPage({ params, searchParams }: ClientPageProps) {
  const { id } = await params;
  const messages = await searchParams;
  const locale = getAdminLocale(messages?.lang);
  const t = adminText[locale];
  const nextLocale = locale === "es" ? "en" : "es";
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

  let client: ClientRow | null = null;
  let crew: CrewMemberRow[] = [];
  let jobs: JobRow[] = [];
  let tasks: FollowUpTaskRow[] = [];
  let loadError = "";

  if (isSupabaseServiceConfigured()) {
    try {
      const [clientRow] = await selectServiceRows<ClientRow>(
        "clients",
        `select=*&id=eq.${encodeURIComponent(id)}&limit=1`
      );
      client = clientRow || null;
      crew = await selectServiceRows<CrewMemberRow>("crew_members", "select=*&status=eq.active&order=is_rosa.desc,name.asc");
      jobs = await selectServiceRows<JobRow>(
        "jobs",
        `select=*&client_id=eq.${encodeURIComponent(id)}&order=scheduled_for.desc.nullslast&limit=25`
      );
      tasks = await selectServiceRows<FollowUpTaskRow>(
        "follow_up_tasks",
        `select=*&client_id=eq.${encodeURIComponent(id)}&order=due_at.asc.nullslast&limit=25`
      );
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Client details could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  const crewNames = new Map(crew.map((member) => [member.id, member.name]));

  if (!client) {
    return (
      <main className="admin-shell">
        <section className="admin-panel narrow">
          <p className="eyebrow">{t.clientDetails}</p>
          <h1>{t.clientNotFound}</h1>
          {loadError ? <p className="admin-alert">{loadError}</p> : null}
          <a className="button secondary" href={`/admin${langQuery(locale)}`}>
            {t.backToClients}
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.clientDetails}</p>
          <h1>{client.name}</h1>
          <p className="admin-muted">
            {client.phone || t.noPhone} {client.address ? `· ${client.address}` : ""}
          </p>
          <AdminNav locale={locale} current="clients" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/clients/${client.id}${langQuery(nextLocale)}`} />
          <a className="button secondary" href={`/admin${langQuery(locale)}`}>
            {t.backToClients}
          </a>
        </div>
      </header>

      {messages?.jobCreated ? <p className="admin-success">{t.jobSaved}</p> : null}
      {messages?.followUpCreated ? <p className="admin-success">{t.followUpSaved}</p> : null}
      {messages?.statusUpdated ? <p className="admin-success">{t.statusUpdated}</p> : null}
      {messages?.inviteSent ? <p className="admin-success">{t.calendarInviteSent}</p> : null}
      {messages?.error || loadError ? <p className="admin-alert">{messages?.error || loadError}</p> : null}

      <section className="admin-detail-grid">
        <section className="admin-panel">
          <h2>{t.clientMemory}</h2>
          <dl className="admin-facts">
            <div>
              <dt>{t.language}</dt>
              <dd>{client.preferred_language.toUpperCase()}</dd>
            </div>
            <div>
              <dt>{t.email}</dt>
              <dd>{client.email || t.notSet}</dd>
            </div>
            <div>
              <dt>{t.preferredChannel}</dt>
              <dd>{channelLabel(client.preferred_communication_channel, locale)}</dd>
            </div>
            <div>
              <dt>{t.frequency}</dt>
              <dd>{frequencyLabel(client.cleaning_frequency, locale)}</dd>
            </div>
            <div>
              <dt>{t.usualTime}</dt>
              <dd>{[client.usual_day, client.usual_time].filter(Boolean).join(", ") || t.notSet}</dd>
            </div>
            <div>
              <dt>{t.price}</dt>
              <dd>{client.current_price_usd ? `$${client.current_price_usd}` : t.notSet}</dd>
            </div>
            <div>
              <dt>{t.reviewReferral}</dt>
              <dd>
                {client.can_ask_for_review ? t.reviewOk : t.reviewNotMarked} ·{" "}
                {client.can_ask_for_referral ? t.referralOk : t.referralNotMarked}
              </dd>
            </div>
          </dl>
          <p className="admin-notes">{client.notes || t.noNotes}</p>
        </section>

        <form className="admin-panel admin-form" action="/api/admin/jobs" method="post">
          <input name="lang" type="hidden" value={locale} />
          <h2>{t.scheduleJob}</h2>
          <input name="clientId" type="hidden" value={client.id} />
          <label>
            {t.scheduledFor}
            <input name="scheduledFor" type="datetime-local" required />
          </label>
          <label>
            {t.assignedCrew}
            <select name="crewMemberId" defaultValue="">
              <option value="">{t.autoAssignCrew}</option>
              {crew.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.is_rosa ? " (Rosa)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-row">
            <label>
              {t.duration}
              <input name="estimatedDurationMinutes" inputMode="numeric" placeholder="180" />
            </label>
            <label>
              {t.price}
              <input name="priceUsd" inputMode="decimal" placeholder="150" />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              {t.service}
              <input name="serviceType" defaultValue={locale === "es" ? "Limpieza recurrente" : "Recurring cleaning"} />
            </label>
            <label>
              {t.status}
              <select name="status" defaultValue="scheduled">
                <option value="scheduled">{t.statusScheduled}</option>
                <option value="needs_confirmation">{t.statusNeedsConfirmation}</option>
                <option value="invite_sent">{t.statusInviteSent}</option>
                <option value="confirmed">{t.statusConfirmed}</option>
                <option value="completed">{t.statusCompleted}</option>
                <option value="cancelled">{t.statusCancelled}</option>
                <option value="reschedule_needed">{t.statusRescheduleNeeded}</option>
              </select>
            </label>
          </div>
          <label>
            {t.notes}
            <textarea name="notes" rows={3} />
          </label>
          <button className="button primary" type="submit">
            {t.saveJob}
          </button>
        </form>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.jobs}</h2>
            <span>{jobs.length}</span>
          </div>
          <div className="admin-list">
            {jobs.length === 0 ? (
              <p className="admin-muted">{t.noJobs}</p>
            ) : (
              jobs.map((job) => (
                <article className="admin-list-row" key={job.id}>
                  <div>
                    <strong>{job.service_type}</strong>
                    <p>
                      {formatDate(job.scheduled_for, locale)} {job.price_usd ? `· $${job.price_usd}` : ""}
                    </p>
                    <p>
                      {t.assignedCrew}: {job.crew_member_id ? crewNames.get(job.crew_member_id) || t.notSet : t.notSet}
                    </p>
                  </div>
                  <div className="admin-row-actions">
                    <form className="admin-inline-form" action={`/api/admin/jobs/${job.id}/calendar-invite`} method="post">
                      <input name="lang" type="hidden" value={locale} />
                      <input name="clientId" type="hidden" value={client.id} />
                      <button className="button secondary compact" type="submit">
                        {t.sendInvite}
                      </button>
                    </form>
                    <form className="admin-inline-form" action={`/api/admin/jobs/${job.id}`} method="post">
                      <input name="lang" type="hidden" value={locale} />
                      <input name="clientId" type="hidden" value={client.id} />
                      <label>
                        <span className="sr-only">{t.updateStatus}</span>
                        <select aria-label={t.updateStatus} name="status" defaultValue={job.status}>
                          <option value="scheduled">{t.statusScheduled}</option>
                          <option value="needs_confirmation">{t.statusNeedsConfirmation}</option>
                          <option value="invite_sent">{t.statusInviteSent}</option>
                          <option value="confirmed">{t.statusConfirmed}</option>
                          <option value="completed">{t.statusCompleted}</option>
                          <option value="cancelled">{t.statusCancelled}</option>
                          <option value="reschedule_needed">{t.statusRescheduleNeeded}</option>
                        </select>
                      </label>
                      <button className="button secondary compact" type="submit">
                        {t.update}
                      </button>
                      <span>{jobStatusLabel(job.status, locale)}</span>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <form className="admin-panel admin-form" action="/api/admin/follow-ups" method="post">
          <input name="lang" type="hidden" value={locale} />
          <h2>{t.addFollowUp}</h2>
          <input name="clientId" type="hidden" value={client.id} />
          <label>
            {t.dueAt}
            <input name="dueAt" type="datetime-local" required />
          </label>
          <label>
            {t.type}
            <select name="taskType" defaultValue="confirm_next_cleaning">
              <option value="confirm_next_cleaning">{t.followConfirm}</option>
              <option value="ask_for_review">{t.followReview}</option>
              <option value="ask_for_referral">{t.followReferral}</option>
              <option value="recurring_offer">{t.followRecurring}</option>
              <option value="manual">{t.followManual}</option>
            </select>
          </label>
          <label>
            {t.notes}
            <textarea name="notes" rows={3} />
          </label>
          <button className="button primary" type="submit">
            {t.saveFollowUp}
          </button>
        </form>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.followUps}</h2>
            <span>{tasks.length}</span>
          </div>
          <div className="admin-list">
            {tasks.length === 0 ? (
              <p className="admin-muted">{t.noFollowUps}</p>
            ) : (
              tasks.map((task) => (
                <article className="admin-list-row" key={task.id}>
                  <div>
                    <strong>{followUpLabel(task.task_type, locale)}</strong>
                    <p>{task.notes || t.noNotes}</p>
                  </div>
                  <span>{formatDate(task.due_at, locale)}</span>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function channelLabel(value: string, locale: "es" | "en") {
  const t = adminText[locale];
  const labels = {
    email: t.channelEmail,
    phone: t.channelPhone,
    sms: t.channelSms,
    whatsapp: t.channelWhatsapp
  };
  return labels[value as keyof typeof labels] || value;
}

function formatDate(value: string | null, locale: "es" | "en") {
  if (!value) {
    return locale === "es" ? "Sin fecha" : "No date";
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value));
}
