import Link from "next/link";
import { ReviewCard } from "@/components/ReviewCard";
import { copy, type Locale } from "@/lib/content";
import { getApprovedReviewsPage } from "@/lib/supabase-rest";

// Full, paginated list of approved reviews (not the homepage's featured 6).
export async function ReviewsPage({ locale, page }: { locale: Locale; page: number }) {
  const t = copy[locale];
  const { reviews, page: current, hasPrev, hasNext } = await getApprovedReviewsPage(locale, page);
  const base = `/${locale}/reviews`;
  const labels = {
    eyebrow: locale === "en" ? "Reviews" : "Reseñas",
    seeAll: t.reviews.seeAll,
    prev: locale === "en" ? "Previous" : "Anterior",
    next: locale === "en" ? "Next" : "Siguiente",
    pageLabel: locale === "en" ? `Page ${current}` : `Página ${current}`,
    back: locale === "en" ? "Back to Medina Clean" : "Volver a Medina Clean"
  };

  return (
    <main className="site-shell">
      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <p className="eyebrow">{labels.eyebrow}</p>
            <h1>{t.reviews.title}</h1>
            <p>{t.reviews.body}</p>
          </div>

          <div className="review-list" aria-live="polite">
            {reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <article className="card">
                <p>{t.reviews.empty}</p>
              </article>
            )}
          </div>

          {reviews.length > 0 && (hasPrev || hasNext) ? (
            <nav className="pagination" aria-label={labels.eyebrow}>
              {hasPrev ? (
                <Link className="button secondary" href={`${base}?page=${current - 1}`} rel="prev">
                  {labels.prev}
                </Link>
              ) : (
                <span />
              )}
              <span className="pagination-page">{labels.pageLabel}</span>
              {hasNext ? (
                <Link className="button secondary" href={`${base}?page=${current + 1}`} rel="next">
                  {labels.next}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}

          <p className="note">
            <a href={`/${locale}#reviews`}>{labels.back}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
