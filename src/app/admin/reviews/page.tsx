import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery } from "@/lib/admin-i18n";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";

export const metadata: Metadata = {
  title: "Rosa Reviews",
  robots: {
    index: false,
    follow: false
  }
};

type ReviewsPageProps = {
  searchParams?: Promise<{ error?: string; approved?: string; rejected?: string; lang?: string }>;
};

type ReviewRow = {
  id: string;
  created_at: string;
  language: "en" | "es";
  name: string;
  rating: number;
  message: string;
  photo_path: string | null;
  consent_to_publish: boolean;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
};

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
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

  let reviews: ReviewRow[] = [];
  let loadError = "";

  if (isSupabaseServiceConfigured()) {
    try {
      reviews = await selectServiceRows<ReviewRow>("reviews", "select=*&order=created_at.desc&limit=100");
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Reviews could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  const pending = reviews.filter((review) => review.status === "pending");
  const approved = reviews.filter((review) => review.status === "approved");
  const rejected = reviews.filter((review) => review.status === "rejected");

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.reviewsTitle}</h1>
          <p className="admin-muted">{t.reviewsCopy}</p>
          <AdminNav locale={locale} current="reviews" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/reviews${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.approved ? <p className="admin-success">{t.reviewApproved}</p> : null}
      {params?.rejected ? <p className="admin-success">{t.reviewRejected}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-review-grid">
        <ReviewColumn title={t.pendingReviews} reviews={pending} locale={locale} allowActions />
        <ReviewColumn title={t.approvedReviews} reviews={approved} locale={locale} />
        <ReviewColumn title={t.rejectedReviews} reviews={rejected} locale={locale} />
      </section>
    </main>
  );
}

function ReviewColumn({
  title,
  reviews,
  locale,
  allowActions = false
}: {
  title: string;
  reviews: ReviewRow[];
  locale: "es" | "en";
  allowActions?: boolean;
}) {
  const t = adminText[locale];
  return (
    <section className="admin-panel">
      <div className="admin-panel-title">
        <h2>{title}</h2>
        <span>{reviews.length}</span>
      </div>
      <div className="admin-list">
        {reviews.length === 0 ? (
          <p className="admin-muted">{t.noReviews}</p>
        ) : (
          reviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div className="admin-review-meta">
                <strong>{review.name}</strong>
                <span>
                  {t.rating}: {review.rating}/5
                </span>
              </div>
              <p>{review.message}</p>
              <small>
                {t.submittedBy} {review.name} · {review.language.toUpperCase()} · {formatDate(review.created_at, locale)}
              </small>
              {allowActions ? (
                <div className="admin-review-actions">
                  <form action={`/api/admin/reviews/${review.id}`} method="post">
                    <input name="lang" type="hidden" value={locale} />
                    <input name="action" type="hidden" value="approve" />
                    <button className="button primary" type="submit">
                      {t.approve}
                    </button>
                  </form>
                  <form action={`/api/admin/reviews/${review.id}`} method="post">
                    <input name="lang" type="hidden" value={locale} />
                    <input name="action" type="hidden" value="reject" />
                    <button className="button secondary" type="submit">
                      {t.reject}
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatDate(value: string, locale: "es" | "en") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York"
  }).format(new Date(value));
}
