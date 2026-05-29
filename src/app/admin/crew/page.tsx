import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery, type AdminLocale } from "@/lib/admin-i18n";
import type { CrewMemberRow, CrewUnavailabilityRow } from "@/lib/crew-records";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Crew",
  robots: {
    index: false,
    follow: false
  }
};

type CrewPageProps = {
  searchParams?: Promise<{
    error?: string;
    crewCreated?: string;
    crewUpdated?: string;
    crewDeleted?: string;
    unavailabilityCreated?: string;
    unavailabilityDeleted?: string;
    lang?: string;
  }>;
};

export default async function CrewPage({ searchParams }: CrewPageProps) {
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

  let crew: CrewMemberRow[] = [];
  let unavailability: CrewUnavailabilityRow[] = [];
  let loadError = "";

  if (isSupabaseServiceConfigured()) {
    try {
      [crew, unavailability] = await Promise.all([
        selectServiceRows<CrewMemberRow>("crew_members", "select=*&order=is_rosa.desc,name.asc"),
        selectServiceRows<CrewUnavailabilityRow>(
          "crew_unavailability",
          `select=*&end_at=gte.${encodeURIComponent(new Date().toISOString())}&order=start_at.asc&limit=100`
        )
      ]);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Crew could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  const crewNames = new Map(crew.map((member) => [member.id, member.name]));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.crewTitle}</h1>
          <p className="admin-muted">{t.crewCopy}</p>
          <AdminNav locale={locale} current="crew" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/crew${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.crewCreated ? <p className="admin-success">{t.crewSaved}</p> : null}
      {params?.crewUpdated ? <p className="admin-success">{t.crewUpdated}</p> : null}
      {params?.crewDeleted ? <p className="admin-success">{t.crewDeleted}</p> : null}
      {params?.unavailabilityCreated ? <p className="admin-success">{t.unavailabilitySaved}</p> : null}
      {params?.unavailabilityDeleted ? <p className="admin-success">{t.unavailabilityDeleted}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-grid">
        <div className="admin-side-stack">
          <form className="admin-panel admin-form" action="/api/admin/crew" method="post">
            <input name="lang" type="hidden" value={locale} />
            <h2>{t.addCrewMember}</h2>
            <CrewFields t={t} />
            <button className="button primary" type="submit">
              {t.saveCrew}
            </button>
          </form>

          <form className="admin-panel admin-form" action="/api/admin/crew-unavailability" method="post">
            <input name="lang" type="hidden" value={locale} />
            <h2>{t.addUnavailability}</h2>
            <label>
              {t.assignedCrew}
              <select name="crewMemberId" required>
                {crew.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.is_rosa ? " (Rosa)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.unavailableStart}
              <input name="startAt" type="datetime-local" required />
            </label>
            <label>
              {t.unavailableEnd}
              <input name="endAt" type="datetime-local" required />
            </label>
            <label>
              {t.reason}
              <input name="reason" defaultValue={locale === "es" ? "No disponible" : "Unavailable"} required />
            </label>
            <label>
              {t.notes}
              <textarea name="notes" rows={3} />
            </label>
            <button className="button primary" type="submit">
              {t.saveBlock}
            </button>
          </form>
        </div>

        <div className="admin-side-stack">
          <section className="admin-panel">
            <div className="admin-panel-title">
              <h2>{t.currentCrew}</h2>
              <span>{crew.length}</span>
            </div>
            <div className="admin-list">
              {crew.length === 0 ? (
                <p className="admin-muted">{t.noCrew}</p>
              ) : (
                crew.map((member) => (
                  <article className="admin-list-row align-start" key={member.id}>
                    <form className="admin-form crew-edit-form" action={`/api/admin/crew/${member.id}`} method="post">
                      <input name="lang" type="hidden" value={locale} />
                      <CrewFields t={t} member={member} />
                      <div className="admin-row-actions">
                        <button className="button secondary compact" type="submit">
                          {t.update}
                        </button>
                        <button className="button secondary compact" name="action" value="delete" type="submit">
                          {t.delete}
                        </button>
                      </div>
                    </form>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-title">
              <h2>{t.upcomingUnavailability}</h2>
              <span>{unavailability.length}</span>
            </div>
            <div className="admin-list">
              {unavailability.length === 0 ? (
                <p className="admin-muted">{t.noUnavailability}</p>
              ) : (
                unavailability.map((entry) => (
                  <article className="admin-list-row" key={entry.id}>
                    <div>
                      <strong>{crewNames.get(entry.crew_member_id) || t.assignedCrew}</strong>
                      <p>
                        {formatDateTime(entry.start_at, locale)} - {formatDateTime(entry.end_at, locale)}
                      </p>
                      <p>{entry.reason}</p>
                    </div>
                    <form action={`/api/admin/crew-unavailability/${entry.id}`} method="post">
                      <input name="lang" type="hidden" value={locale} />
                      <button className="button secondary compact" type="submit">
                        {t.delete}
                      </button>
                    </form>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function CrewFields({ t, member }: { t: (typeof adminText)[AdminLocale]; member?: CrewMemberRow }) {
  return (
    <>
      <label>
        {t.name}
        <input name="name" defaultValue={member?.name || ""} required />
      </label>
      <div className="admin-form-row">
        <label>
          {t.phone}
          <input name="phone" defaultValue={member?.phone || ""} inputMode="tel" autoComplete="tel" />
        </label>
        <label>
          {t.email}
          <input name="email" defaultValue={member?.email || ""} type="email" autoComplete="email" />
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          {t.role}
          <select name="role" defaultValue={member?.role || "cleaner"}>
            <option value="owner">{t.roleOwner}</option>
            <option value="cleaner">{t.roleCleaner}</option>
            <option value="contractor">{t.roleContractor}</option>
          </select>
        </label>
        <label>
          {t.status}
          <select name="status" defaultValue={member?.status || "active"}>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          {t.weekdayStart}
          <input name="defaultWeekdayStart" type="time" defaultValue={member?.default_weekday_start || "10:00"} required />
        </label>
        <label>
          {t.weekdayEnd}
          <input name="defaultWeekdayEnd" type="time" defaultValue={member?.default_weekday_end || "17:00"} required />
        </label>
      </div>
      <div className="admin-checks">
        <label>
          <input name="isRosa" type="checkbox" defaultChecked={member?.is_rosa || false} /> {t.isRosa}
        </label>
      </div>
      <label>
        {t.notes}
        <textarea name="notes" rows={3} defaultValue={member?.notes || ""} />
      </label>
    </>
  );
}

function formatDateTime(value: string, locale: "es" | "en") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value));
}
