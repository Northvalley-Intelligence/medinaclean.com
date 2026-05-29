import { adminText, type AdminLocale } from "@/lib/admin-i18n";

type AdminLanguageSwitchProps = {
  locale: AdminLocale;
  href: string;
};

export function AdminLanguageSwitch({ locale, href }: AdminLanguageSwitchProps) {
  const t = adminText[locale];
  return (
    <a className="button secondary" href={href}>
      {locale === "es" ? t.english : t.spanish}
    </a>
  );
}
