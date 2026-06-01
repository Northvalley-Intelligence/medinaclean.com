import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery } from "@/lib/admin-i18n";
import { isSupabaseServiceConfigured, selectServiceRows } from "@/lib/supabase-rest";
import type { SiteVideoRow } from "@/lib/video-records";

export const metadata: Metadata = {
  title: "Rosa Videos",
  robots: {
    index: false,
    follow: false
  }
};

type VideosPageProps = {
  searchParams?: Promise<{ error?: string; uploaded?: string; lang?: string }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
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

  let videos: SiteVideoRow[] = [];
  let loadError = "";
  if (isSupabaseServiceConfigured()) {
    try {
      videos = await selectServiceRows<SiteVideoRow>("site_videos", "select=*&order=created_at.desc&limit=100");
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Videos could not be loaded.";
    }
  } else {
    loadError = "Supabase service access is not configured.";
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">{t.privateOps}</p>
          <h1>{t.videosTitle}</h1>
          <p className="admin-muted">{t.videosCopy}</p>
          <AdminNav locale={locale} current="videos" />
        </div>
        <div className="admin-header-actions">
          <AdminLanguageSwitch locale={locale} href={`/admin/videos${langQuery(nextLocale)}`} />
          <form action="/api/admin/logout" method="post">
            <button className="button secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      {params?.uploaded ? <p className="admin-success">{t.videoUploaded}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.uploadVideo}</h2>
            <span>YouTube</span>
          </div>
          <form
            id="admin-video-upload-form"
            className="video-upload-form"
            action="/api/admin/videos"
            method="post"
            encType="multipart/form-data"
          >
            <div className="admin-form">
              <input name="lang" type="hidden" value={locale} />
              <label>
                {t.titleEn}
                <input name="titleEn" required maxLength={120} placeholder="Before and after kitchen" />
              </label>
              <label>
                {t.titleEs}
                <input name="titleEs" required maxLength={120} placeholder="Antes y después cocina" />
              </label>
              <label>
                {t.videoDescription}
                <input name="description" maxLength={1000} />
              </label>
              <label>
                {t.privacy}
                <select name="privacyStatus" defaultValue="public">
                  <option value="public">{t.privacyPublic}</option>
                  <option value="unlisted">{t.privacyUnlisted}</option>
                  <option value="private">{t.privacyPrivate}</option>
                </select>
              </label>
              <label>
                {t.videoFile}
                <input name="video" type="file" accept="video/mp4,video/quicktime,video/webm" required />
              </label>
            </div>
          </form>
          <button className="button primary admin-submit-button" type="submit" form="admin-video-upload-form">
            {t.uploadToYouTube}
          </button>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.currentVideos}</h2>
            <span>{videos.length}</span>
          </div>
          <div className="admin-list">
            {videos.length === 0 ? (
              <p className="admin-muted">{t.noVideos}</p>
            ) : (
              videos.map((video) => (
                <article className="admin-review-card" key={video.id}>
                  <div className="admin-review-meta">
                    <strong>{locale === "es" ? video.title_es : video.title_en}</strong>
                    <span>{video.privacy_status}</span>
                  </div>
                  <small>{video.youtube_video_id}</small>
                  <a className="button secondary compact" href={video.youtube_url} target="_blank" rel="noreferrer">
                    {t.watchVideo}
                  </a>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
