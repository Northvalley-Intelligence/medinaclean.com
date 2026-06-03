import { CalendarCheck, Home, Languages, MapPin } from "lucide-react";
import Image from "next/image";
import { phone } from "@/lib/content";
import {
  buildLocalServiceJsonLd,
  getLocalServiceAlternate,
  type LocalServicePage as LocalServicePageContent
} from "@/lib/local-seo";

export function LocalServicePage({ page }: { page: LocalServicePageContent }) {
  const scheduleLabel = page.locale === "en" ? "Request an appointment" : "Pedir una cita";
  const homeLabel = page.locale === "en" ? "Medina Clean home" : "Inicio de Medina Clean";
  const otherLocale = page.locale === "en" ? "es" : "en";
  const alternatePage = getLocalServiceAlternate(page);
  const otherLocaleHref = alternatePage ? `/${alternatePage.locale}/${alternatePage.slug}` : `/${otherLocale}`;

  return (
    <main className="site-shell local-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLocalServiceJsonLd(page, phone)) }}
      />
      <header className="local-header">
        <a className="brand" href={`/${page.locale}`} aria-label={homeLabel}>
          <Image
            className="brand-logo"
            src="/brand/medina-clean-logo.png"
            alt="Medina Clean"
            width={1536}
            height={1024}
            priority
          />
        </a>
        <nav className="nav-actions" aria-label="Language">
          <a className="button secondary" href={otherLocaleHref}>
            <Languages size={17} aria-hidden />
            {otherLocale.toUpperCase()}
          </a>
          <a className="button primary" href={`/${page.locale}#schedule`}>
            <CalendarCheck size={17} aria-hidden />
            {scheduleLabel}
          </a>
        </nav>
      </header>

      <section className="local-hero">
        <p className="eyebrow">{page.serviceName}</p>
        <h1>{page.h1}</h1>
        <p>{page.intro}</p>
        <div className="local-hero-meta" aria-label="Service area highlights">
          <span>
            <MapPin size={17} aria-hidden />
            {page.locale === "en"
              ? "Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell"
              : "Woodstock, Marietta, Kennesaw, Acworth, Canton y Roswell"}
          </span>
          <span>
            <Home size={17} aria-hidden />
            {page.locale === "en" ? "Homes, apartments, condos, and small businesses" : "Casas, apartamentos, condominios y pequeños negocios"}
          </span>
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner local-grid">
          <article className="card local-card">
            <h2>{page.locale === "en" ? "Services covered" : "Servicios incluidos"}</h2>
            <ul>
              {page.serviceTypes.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </article>
          <article className="card local-card">
            <h2>{page.locale === "en" ? "Nearby areas" : "Áreas cercanas"}</h2>
            <ul>
              {page.neighborhoods.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-inner local-content">
          {page.sections.map((section) => (
            <article key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner forms">
          <div className="faq">
            <h2>{page.locale === "en" ? "Local cleaning questions" : "Preguntas de limpieza local"}</h2>
            {page.faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <article className="card local-cta">
            <h2>{page.locale === "en" ? "Ready to check availability?" : "¿Quiere revisar disponibilidad?"}</h2>
            <p>
              {page.locale === "en"
                ? "Send Rosa three possible appointment times. The request is private and Rosa confirms before booking."
                : "Envíe a Rosa tres horarios posibles. La solicitud es privada y Rosa confirma antes de reservar."}
            </p>
            <a className="button primary" href={`/${page.locale}#schedule`}>
              <CalendarCheck size={18} aria-hidden />
              {scheduleLabel}
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
