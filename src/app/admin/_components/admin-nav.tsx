import { adminText, type AdminLocale, langQuery } from "@/lib/admin-i18n";

type AdminNavProps = {
  locale: AdminLocale;
  current: "clients" | "calendar" | "crew" | "tasks" | "reviews" | "videos";
};

export function AdminNav({ locale, current }: AdminNavProps) {
  const t = adminText[locale];
  return (
    <nav className="admin-nav" aria-label={t.privateOps}>
      <a aria-current={current === "clients" ? "page" : undefined} href={`/admin${langQuery(locale)}`}>
        {t.clientsNav}
      </a>
      <a aria-current={current === "calendar" ? "page" : undefined} href={`/admin/calendar${langQuery(locale)}`}>
        {t.calendarNav}
      </a>
      <a aria-current={current === "crew" ? "page" : undefined} href={`/admin/crew${langQuery(locale)}`}>
        {t.crewNav}
      </a>
      <a aria-current={current === "tasks" ? "page" : undefined} href={`/admin/tasks${langQuery(locale)}`}>
        {t.tasksNav}
      </a>
      <a aria-current={current === "reviews" ? "page" : undefined} href={`/admin/reviews${langQuery(locale)}`}>
        {t.reviewsNav}
      </a>
      <a aria-current={current === "videos" ? "page" : undefined} href={`/admin/videos${langQuery(locale)}`}>
        {t.videosNav}
      </a>
    </nav>
  );
}
