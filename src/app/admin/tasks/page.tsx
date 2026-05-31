import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery } from "@/lib/admin-i18n";
import type { ClientRow } from "@/lib/client-records";
import type { JobRow } from "@/lib/operations-records";
import { buildAttentionTasks, type AppointmentRequestLike, type AttentionTask } from "@/lib/scheduling";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Rosa Tasks",
  robots: {
    index: false,
    follow: false
  }
};

type TasksPageProps = {
  searchParams?: Promise<{ lang?: string; error?: string; nextJobCreated?: string }>;
};

type ReviewRow = {
  id: string;
  created_at: string;
  name: string;
  status: string;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const locale = getAdminLocale(params?.lang);
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

  let tasks: AttentionTask[] = [];
  let loadError = "";

  if (isSupabaseServiceConfigured()) {
    try {
      const [clients, jobs, reviews, appointmentRequests] = await Promise.all([
        selectServiceRows<ClientRow>("clients", "select=*&order=name.asc&limit=200"),
        selectServiceRows<JobRow>("jobs", "select=*&order=scheduled_for.asc.nullslast&limit=200"),
        selectServiceRows<ReviewRow>("reviews", "select=id,created_at,name,status&order=created_at.desc&limit=100"),
        selectServiceRows<AppointmentRequestLike>(
          "appointment_requests",
          "select=id,created_at,name,phone,address,zip_code,service_type,status,source&status=eq.pending&order=created_at.desc&limit=100"
        )
      ]);
      tasks = buildAttentionTasks({ now: new Date(), clients, jobs, reviews, appointmentRequests });
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Tasks could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.tasksTitle}</h1>
          <p className="admin-muted">{t.tasksCopy}</p>
          <AdminNav locale={locale} current="tasks" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/tasks${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}
      {params?.nextJobCreated ? <p className="admin-success">{t.nextCleaningCreated}</p> : null}

      <section className="admin-panel admin-wide-panel">
        <div className="admin-panel-title">
          <h2>{t.tasksTitle}</h2>
          <span>{tasks.length}</span>
        </div>
        <div className="admin-list">
          {tasks.length === 0 ? (
            <p className="admin-muted">{t.noTasks}</p>
          ) : (
            tasks.map((task) => (
              <article className="admin-list-row" id={task.id} key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>{taskLabel(task.type, locale)} · {task.detail}</p>
                </div>
                <TaskAction task={task} locale={locale} />
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function TaskAction({ task, locale }: { task: AttentionTask; locale: "es" | "en" }) {
  const t = adminText[locale];

  if (task.type === "next_job_needed") {
    return (
      <form action="/api/admin/recurring-jobs" method="post">
        <input name="lang" type="hidden" value={locale} />
        <input name="clientId" type="hidden" value={task.subject_id} />
        <button className="button secondary compact" type="submit">
          {t.createNextCleaning}
        </button>
      </form>
    );
  }

  return (
    <a className="button secondary compact" href={taskHref(task, locale)}>
      {taskLabel(task.type, locale)}
    </a>
  );
}

function taskHref(task: AttentionTask, locale: "es" | "en") {
  if (task.type === "appointment_request") {
    return `/admin/tasks${langQuery(locale)}#${task.id}`;
  }

  return `${task.href}${langQuery(locale)}`;
}

function taskLabel(type: AttentionTask["type"], locale: "es" | "en") {
  const t = adminText[locale];
  const labels = {
    review_approval: t.taskReviewApproval,
    job_confirmation: t.taskJobConfirmation,
    next_job_needed: t.taskNextJobNeeded,
    appointment_request: t.taskAppointmentRequest
  };
  return labels[type];
}
