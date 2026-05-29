import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminClientForm } from "@/app/admin/_components/admin-client-form";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, frequencyLabel, getAdminLocale, langQuery } from "@/lib/admin-i18n";
import type { ClientRow } from "@/lib/client-records";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Rosa Admin",
  description: "Private Medina Clean operations dashboard.",
  robots: {
    index: false,
    follow: false
  }
};

type AdminPageProps = {
  searchParams?: Promise<{ error?: string; created?: string; lang?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = getAdminLocale(params?.lang);
  const t = adminText[locale];
  const nextLocale = locale === "es" ? "en" : "es";
  const cookieStore = await cookies();
  const authenticated = await verifyAdminSession(cookieStore.get(adminSessionCookie)?.value);

  if (!isAdminConfigured()) {
    return (
      <main className="admin-shell">
        <section className="admin-panel narrow">
          <p className="eyebrow">{t.setup}</p>
          <h1>{t.setupTitle}</h1>
          <p className="admin-muted">{t.setupCopy}</p>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-shell">
        <section className="admin-panel narrow">
          <p className="eyebrow">Medina Clean</p>
          <h1>{t.rosaAdmin}</h1>
          <p className="admin-muted">{t.loginCopy}</p>
          <div className="admin-login-actions">
            <AdminLanguageSwitch locale={locale} href={`/admin${langQuery(nextLocale)}`} />
          </div>
          {params?.error ? <p className="admin-alert">{params.error}</p> : null}
          <form className="admin-form" action="/api/admin/login" method="post">
            <input name="lang" type="hidden" value={locale} />
            <label>
              {t.password}
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <button className="button primary" type="submit">
              {t.signIn}
            </button>
          </form>
        </section>
      </main>
    );
  }

  let clients: ClientRow[] = [];
  let loadError = "";
  if (isSupabaseServiceConfigured()) {
    try {
      clients = await selectServiceRows<ClientRow>("clients", "select=*&order=created_at.desc&limit=50");
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Clients could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.clientsTitle}</h1>
          <p className="admin-muted">{t.clientsCopy}</p>
          <AdminNav locale={locale} current="clients" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.created ? <p className="admin-success">{t.clientSaved}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-grid">
        <AdminClientForm locale={locale} />

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.currentClients}</h2>
            <span>
              {clients.length}/13 {t.onboarded}
            </span>
          </div>
          <div className="client-list">
            {clients.length === 0 ? (
              <p className="admin-muted">{t.noClients}</p>
            ) : (
              clients.map((client) => (
                <article className="client-row" key={client.id}>
                  <div>
                    <strong>{client.name}</strong>
                    <p>
                      {frequencyLabel(client.cleaning_frequency, locale)}
                      {client.current_price_usd ? ` · $${client.current_price_usd}` : ""}
                    </p>
                  </div>
                  <div className="client-row-actions">
                    <span>{client.preferred_language.toUpperCase()}</span>
                    <a className="button secondary compact" href={`/admin/clients/${client.id}${langQuery(locale)}`}>
                      {t.viewDetails}
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
