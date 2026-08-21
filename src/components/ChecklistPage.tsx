import { CalendarCheck, CheckCircle2, Languages, Phone, XCircle } from "lucide-react";
import Image from "next/image";
import { phone, phoneDisplay, type Locale } from "@/lib/content";
import { getChecklistAlternateHref, getChecklistPage } from "@/lib/checklist";
import { googleMapsSearchUrl, openGraphImage } from "@/lib/site-seo";

export function ChecklistPage({ locale }: { locale: Locale }) {
  const t = getChecklistPage(locale);
  const homeLabel = locale === "en" ? "Medina Clean home" : "Inicio de Medina Clean";
  const otherLocale: Locale = locale === "en" ? "es" : "en";
  const otherLocaleHref = getChecklistAlternateHref(locale);
  const scheduleHref = `/${locale}#schedule`;
  const pricingHref = `/${locale}#pricing`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t.title,
    url: `https://medinaclean.com/${locale}/${t.slug}`,
    description: t.description,
    image: openGraphImage.url,
    provider: {
      "@type": "LocalBusiness",
      name: "Medina Clean",
      url: "https://medinaclean.com",
      hasMap: googleMapsSearchUrl
    },
    serviceType: t.tiers.map((tier) => tier.name),
    areaServed: ["Woodstock GA", "30188", "Marietta GA", "Kennesaw GA", "Acworth GA", "Canton GA", "Roswell GA"],
    availableLanguage: ["English", "Spanish"]
  };

  return (
    <main className="site-shell local-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="local-header">
        <a className="brand" href={`/${locale}`} aria-label={homeLabel}>
          <Image
            className="brand-logo"
            src="/brand/medina-clean-logo.png"
            alt="Medina Clean"
            width={1536}
            height={1024}
            priority
          />
        </a>
        <nav className="nav-actions" aria-label={locale === "en" ? "Checklist navigation" : "Navegación de la lista"}>
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
            {t.cta.scheduleLabel}
          </a>
        </nav>
      </header>

      <section className="local-hero">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.h1}</h1>
        <p>{t.intro}</p>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.tiersTitle}</h2>
          </div>
          <div className="checklist-tiers">
            {t.tiers.map((tier) => (
              <article className="card checklist-tier" key={tier.id}>
                <h3>{tier.name}</h3>
                <p className="checklist-tier-intro">{tier.intro}</p>
                {tier.roomGroups ? (
                  <div className="checklist-room-grid">
                    {tier.roomGroups.map((group) => (
                      <div className="checklist-room" key={`${tier.id}-${group.room}`}>
                        <h4>{group.room}</h4>
                        {group.note ? <p className="checklist-room-note">{group.note}</p> : null}
                        <ul>
                          {group.tasks.map((task) => (
                            <li key={task}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
                {tier.flatTasks ? (
                  <ul className="checklist-flat-list">
                    {tier.flatTasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.expectations.title}</h2>
            <p>{t.expectations.body}</p>
          </div>
          <div className="local-grid checklist-expectations-grid">
            <article className="card local-card">
              <h2>
                <CheckCircle2 color="#2f9e63" size={20} aria-hidden style={{ verticalAlign: "-4px", marginRight: 8 }} />
                {t.expectations.doTitle}
              </h2>
              <ul>
                {t.expectations.doItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="card local-card">
              <h2>
                <XCircle color="#c23b3b" size={20} aria-hidden style={{ verticalAlign: "-4px", marginRight: 8 }} />
                {t.expectations.dontTitle}
              </h2>
              <ul>
                {t.expectations.dontItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>{t.addOns.title}</h2>
            <p>{t.addOns.body}</p>
          </div>
          <ul className="checklist-addons">
            {t.addOns.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner forms">
          <article className="card local-cta">
            <h2>{t.cta.title}</h2>
            <p>{t.cta.body}</p>
            <a className="button primary" href={scheduleHref}>
              <CalendarCheck size={18} aria-hidden />
              {t.cta.scheduleLabel}
            </a>
            <a className="button secondary" href={pricingHref}>
              {t.cta.pricingLabel}
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
