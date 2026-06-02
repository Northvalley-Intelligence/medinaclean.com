import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminAdsPlannerForm } from "@/app/admin/_components/admin-ads-planner-form";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery } from "@/lib/admin-i18n";

export const metadata: Metadata = {
  title: "Rosa Ads",
  robots: {
    index: false,
    follow: false
  }
};

type AdsPageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function AdsPage({ searchParams }: AdsPageProps) {
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

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.adsTitle}</h1>
          <p className="admin-muted">{t.adsCopy}</p>
          <AdminNav locale={locale} current="ads" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/ads${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      <section className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.adsPlanner}</h2>
            <span>{t.adsManagerStatus}</span>
          </div>
          <AdminAdsPlannerForm locale={locale} />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.adsManagerStatus}</h2>
            <span>North Valley</span>
          </div>
          <p className="admin-muted">{t.adsManagerCopy}</p>
          <div className="admin-panel-title compact">
            <h3>{t.launchChecklist}</h3>
          </div>
          <ul className="admin-checklist">
            {t.launchChecklistItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
