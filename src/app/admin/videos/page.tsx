import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLanguageSwitch } from "@/app/admin/_components/admin-language-switch";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { AdminVideoUploadForm } from "@/app/admin/_components/admin-video-upload-form";
import { adminSessionCookie, isAdminConfigured, verifyAdminSession } from "@/lib/admin-auth";
import { adminText, getAdminLocale, langQuery } from "@/lib/admin-i18n";
import { isSupabaseServiceConfigured, isYouTubeVideoAvailable, selectServiceRows } from "@/lib/supabase-rest";
import { mapAdminVideoRow, type AdminSiteVideo, type SiteVideoRow } from "@/lib/video-records";

export const metadata: Metadata = {
  title: "Rosa Videos",
  robots: {
    index: false,
    follow: false
  }
};

type VideosPageProps = {
  searchParams?: Promise<{ error?: string; uploaded?: string; updated?: string; lang?: string }>;
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

  let videos: AdminSiteVideo[] = [];
  let loadError = "";
  if (isSupabaseServiceConfigured()) {
    try {
      const rows = await selectServiceRows<SiteVideoRow>("site_videos", "select=*&order=created_at.desc&limit=100");
      const availability = await Promise.all(rows.map((video) => isYouTubeVideoAvailable(video.youtube_url)));
      videos = rows.map((video, index) => mapAdminVideoRow(video, availability[index]));
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
      {params?.updated ? <p className="admin-success">{t.videoUpdated}</p> : null}
      {params?.error || loadError ? <p className="admin-alert">{params?.error || loadError}</p> : null}

      <section className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-title">
            <h2>{t.uploadVideo}</h2>
            <span>YouTube</span>
          </div>
          <AdminVideoUploadForm locale={locale} />
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
                  {video.youtubeAvailable ? (
                    <iframe
                      className="admin-video-preview"
                      src={video.embed_url}
                      title={locale === "es" ? video.title_es : video.title_en}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="admin-video-preview unavailable">{t.youtubeUnavailable}</div>
                  )}
                  <div className="admin-review-meta">
                    <strong>{locale === "es" ? video.title_es : video.title_en}</strong>
                    <span>{video.is_visible ? t.visibleOnSite : t.hiddenFromSite}</span>
                  </div>
                  <small>{video.youtube_video_id}</small>
                  <a className="button secondary compact" href={video.youtube_url} target="_blank" rel="noreferrer">
                    {t.watchVideo}
                  </a>
                  <form action={`/api/admin/videos/${video.id}`} method="post">
                    <input name="lang" type="hidden" value={locale} />
                    <input name="isVisible" type="hidden" value={video.is_visible ? "false" : "true"} />
                    <button className="button secondary compact" type="submit">
                      {video.is_visible ? t.hideVideo : t.showVideo}
                    </button>
                  </form>
                  <form action={`/api/admin/videos/${video.id}`} method="post">
                    <input name="lang" type="hidden" value={locale} />
                    <input name="action" type="hidden" value="delete" />
                    <button className="button secondary compact" type="submit" title={t.removeVideoRecordHint}>
                      {t.removeVideoRecord}
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
