import { CalendarCheck, ExternalLink, Languages, Phone } from "lucide-react";
import Image from "next/image";
import { copy, phone, phoneDisplay, type Locale } from "@/lib/content";
import { googleMapsSearchUrl, openGraphImage } from "@/lib/site-seo";

export function AboutPage({ locale }: { locale: Locale }) {
  const t = copy[locale].aboutPage;
  const otherLocale = locale === "en" ? "es" : "en";
  const homeHref = `/${locale}`;
  const scheduleHref = `/${locale}#schedule`;
  const otherLocaleHref = locale === "en" ? "/es/sobre-rosa-medina" : "/en/about-rosa-medina";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        name: t.title,
        url: `https://medinaclean.com${locale === "en" ? "/en/about-rosa-medina" : "/es/sobre-rosa-medina"}`,
        inLanguage: locale === "en" ? "en-US" : "es-US",
        about: {
          "@type": "CleaningService",
          name: "Medina Clean",
          url: "https://medinaclean.com",
          image: openGraphImage.url,
          hasMap: googleMapsSearchUrl
        }
      },
      {
        "@type": "Person",
        name: "Rosa Medina",
        worksFor: {
          "@type": "LocalBusiness",
          name: "Medina Clean",
          url: "https://medinaclean.com",
          areaServed: ["Woodstock GA", "30188", "Marietta GA", "Kennesaw GA", "Acworth GA", "Canton GA", "Roswell GA"]
        }
      }
    ]
  };

  return (
    <main className="site-shell about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="local-header">
        <a className="brand" href={homeHref} aria-label={t.homeCta}>
          <Image
            className="brand-logo"
            src="/brand/medina-clean-logo.png"
            alt="Medina Clean"
            width={1536}
            height={1024}
            priority
          />
        </a>
        <nav className="nav-actions" aria-label={locale === "en" ? "About navigation" : "Navegación de información"}>
          <a className="button secondary" href={otherLocaleHref}>
            <Languages size={17} aria-hidden />
            {otherLocale.toUpperCase()}
          </a>
          {phone ? (
            <a className="button secondary" href={`tel:${phone}`} aria-label="Call Medina Clean">
              <Phone size={17} aria-hidden />
              {phoneDisplay}
            </a>
          ) : null}
          <a className="button primary" href={scheduleHref}>
            <CalendarCheck size={17} aria-hidden />
            {t.scheduleCta}
          </a>
        </nav>
      </header>

      <section className="about-hero">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <div className="hero-actions">
            <a className="button primary" href={scheduleHref}>
              <CalendarCheck size={18} aria-hidden />
              {t.scheduleCta}
            </a>
            <a className="button secondary" href={googleMapsSearchUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={17} aria-hidden />
              {t.mapsCta}
            </a>
          </div>
        </div>
        <Image
          className="about-hero-media"
          src="/gallery/hero-clean-home.png"
          alt=""
          width={887}
          height={444}
          priority
          sizes="(max-width: 920px) 100vw, 42vw"
        />
      </section>

      <section className="section alt">
        <div className="section-inner about-grid">
          <div className="about-sections">
            {t.sections.map(([title, body]) => (
              <article key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <aside className="card fact-card" aria-label={locale === "en" ? "Medina Clean facts" : "Datos de Medina Clean"}>
            <h2>{locale === "en" ? "Business facts" : "Datos del negocio"}</h2>
            <dl>
              {t.facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
}
