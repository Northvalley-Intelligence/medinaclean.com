import { Building2, CalendarCheck, Camera, Gift, Home, MessageCircle, Phone, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ReviewForm } from "@/components/ReviewForm";
import { copy, instagram, phone, pricing, type Locale, whatsapp } from "@/lib/content";
import { getApprovedReviews } from "@/lib/supabase-rest";

export async function SitePage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const otherLocale = locale === "en" ? "es" : "en";
  const approvedReviews = await getApprovedReviews(locale);

  return (
    <main className="site-shell">
      <JsonLd locale={locale} />
      <header className="topbar">
        <a className="promo-strip" href="#referral">
          <Gift size={17} aria-hidden />
          <span>{t.referral.topline}</span>
          <strong>{t.referral.title}</strong>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href={`/${locale}`}>
            <Image
              className="brand-logo"
              src="/brand/medina-clean-logo.png"
              alt="Medina Clean"
              width={1536}
              height={1024}
              priority
            />
          </a>
          <div className="nav-links">
            <a href="#services">{t.nav.services}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#reviews">{t.nav.reviews}</a>
            <a href="#schedule">{t.nav.schedule}</a>
          </div>
          <div className="nav-actions">
            <div className="lang-switch" aria-label="Language">
              <a className={locale === "en" ? "active" : ""} href="/en">
                EN
              </a>
              <a className={locale === "es" ? "active" : ""} href="/es">
                ES
              </a>
            </div>
            {phone ? (
              <a className="button secondary" href={`tel:${phone}`}>
                <Phone size={17} aria-hidden />
                {t.nav.call}
              </a>
            ) : null}
          </div>
        </nav>
      </header>

      <section className="hero">
        <div>
          <Image
            className="hero-logo"
            src="/brand/medina-clean-logo.png"
            alt="Medina Clean"
            width={1536}
            height={1024}
            priority
          />
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p className="hero-copy">{t.hero.body}</p>
          <div className="hero-actions">
            <a className="button primary" href="#schedule">
              <CalendarCheck size={18} aria-hidden />
              {t.hero.primary}
            </a>
            <a className="button ghost" href={whatsapp}>
              <MessageCircle size={18} aria-hidden />
              {t.hero.whatsapp}
            </a>
            <a className="button ghost" href={instagram}>
              <Camera size={18} aria-hidden />
              Instagram
            </a>
          </div>
        </div>
        <div className="hero-panel" role="img" aria-label="Clean home interior with pink cleaning accents">
          <div className="hero-panel-inner">
            <strong>Woodstock, GA</strong>
            <span>30188 + nearby homes and businesses</span>
          </div>
        </div>
      </section>

      <section className="stat-row" aria-label="Highlights">
        {t.stats.map(([value, label]) => (
          <div className="stat" key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="section alt reviews-section" id="reviews">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.reviews.title}</h2>
            <p>{t.reviews.body}</p>
          </div>
          <div className="review-display">
            <ReviewList approvedReviews={approvedReviews} emptyText={t.reviews.empty} />
          </div>
        </div>
      </section>

      <section className="section alt" id="services">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.services.title}</h2>
            <p>{t.services.body}</p>
          </div>
          <div className="grid">
            {t.services.items.map(([title, body], index) => {
              const Icon = [Home, Building2, Sparkles, Building2][index];
              return (
                <article className="card" key={title}>
                  <Icon color="#d6337b" size={24} aria-hidden />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.pricing.title}</h2>
            <p>{t.pricing.body}</p>
          </div>
          <div className="pricing-wrap">
            <table className="pricing">
              <thead>
                <tr>
                  {t.pricing.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.map((row) => (
                  <tr key={row.bedrooms}>
                    <td>{row.bedrooms}</td>
                    <td>{row.baths}</td>
                    <td>{row.oneTime}</td>
                    <td>{row.everyThreeWeeks}</td>
                    <td>{row.everyTwoWeeks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">{t.pricing.note}</p>
        </div>
      </section>

      <section className="section alt" id="referral">
        <div className="section-inner">
          <div className="referral">
            <div className="review-display">
              <p className="eyebrow">Referral</p>
              <h2>{t.referral.title}</h2>
              <p>{t.referral.body}</p>
            </div>
            <Gift color="#d6337b" size={42} aria-hidden />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.gallery.title}</h2>
            <p>{t.gallery.body}</p>
          </div>
          <div className="gallery-slots">
            <div className="slot">Before / after</div>
            <div className="slot">Rosa at work</div>
            <div className="slot">Finished rooms</div>
          </div>
        </div>
      </section>

      <section className="section" id="schedule">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.schedule.title}</h2>
            <p>{t.schedule.body}</p>
          </div>
          <div className="forms">
            <article className="card">
              <h3>{t.schedule.formTitle}</h3>
              <AppointmentForm locale={locale} />
            </article>
            <div className="faq">
              <h2>{t.faq.title}</h2>
              {t.faq.items.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section alt" id="leave-review">
        <div className="section-inner">
          <article className="card leave-review-card">
            <h2>{t.reviews.formTitle}</h2>
            <ReviewForm locale={locale} />
          </article>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div>
            <Image
              className="footer-logo"
              src="/brand/medina-clean-logo.png"
              alt="Medina Clean"
              width={1536}
              height={1024}
            />
            <p>{t.privacy}</p>
            <p>
              Built by <a href="https://northvalleyintel.com">Northvalley Intelligence LLC</a> (
              <a href="https://northvalleyintel.com">northvalleyintel.com</a>). For similar projects, contact{" "}
              <a href="mailto:contact@northvalleyintel.com">contact@northvalleyintel.com</a>.
            </p>
          </div>
          <div className="nav-actions">
            <a className="button secondary" href={`/${otherLocale}`}>
              {otherLocale.toUpperCase()}
            </a>
            {phone ? (
              <a className="button secondary" href={`tel:${phone}`}>
                <Phone size={17} aria-hidden />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}

function ReviewList({
  approvedReviews,
  emptyText
}: {
  approvedReviews: Awaited<ReturnType<typeof getApprovedReviews>>;
  emptyText: string;
}) {
  return (
    <div className="review-list" aria-live="polite">
      {approvedReviews.length > 0 ? (
        approvedReviews.map((review) => (
          <article className="card review-card" key={review.id}>
            <div className="review-person">
              {review.photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="review-avatar"
                  src={`/api/review-photo?path=${encodeURIComponent(review.photo_path)}`}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="review-avatar" aria-hidden>
                  {review.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h3>{review.name}</h3>
                <div className="stars" aria-label={`${review.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= review.rating ? "#d6337b" : "none"}
                      color="#d6337b"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </div>
            <p>{review.message}</p>
          </article>
        ))
      ) : (
        <article className="card">
          <div className="stars" aria-label="5 stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} fill="#d6337b" color="#d6337b" aria-hidden />
            ))}
          </div>
          <p>{emptyText}</p>
        </article>
      )}
    </div>
  );
}

function JsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    name: "Medina Clean",
    url: "https://medinaclean.com",
    areaServed: ["Woodstock GA", "30188", "Cherokee County GA", "Cobb County GA"],
    availableLanguage: ["English", "Spanish"],
    priceRange: "$$",
    serviceType: ["House cleaning", "Apartment cleaning", "Condo cleaning", "Deep cleaning", "Office cleaning"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Woodstock",
      addressRegion: "GA",
      postalCode: "30188",
      addressCountry: "US"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: locale === "en" ? "Cleaning services" : "Servicios de limpieza",
      itemListElement: pricing.map((row) => ({
        "@type": "Offer",
        name: `${row.bedrooms} bedroom cleaning`,
        priceCurrency: "USD",
        price: row.oneTime.replace("$", "")
      }))
    }
  };

  const jsonLd = phone ? { ...data, telephone: phone } : data;

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
