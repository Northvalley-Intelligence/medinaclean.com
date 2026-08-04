import { parseYouTubeId } from "./video-links";

// GEN-002 follow-up — add an EXISTING YouTube video to the public gallery by URL (no file upload).
// Pure builder: validates the URL + titles and shapes a site_videos insert row. The route layer
// checks availability (oembed) and persists. site_videos requires both title_en and title_es.

export type ExistingVideoInput = {
  url?: string;
  titleEn?: string;
  titleEs?: string;
  description?: string;
  privacyStatus?: string;
};

export type SiteVideoInsert = {
  title_en: string;
  title_es: string;
  description: string | null;
  youtube_video_id: string;
  youtube_url: string;
  embed_url: string;
  privacy_status: "public" | "unlisted" | "private";
  is_visible: boolean;
};

const privacyValues = new Set<SiteVideoInsert["privacy_status"]>(["public", "unlisted", "private"]);

export function buildExistingVideoRow(
  input: ExistingVideoInput
): { ok: true; row: SiteVideoInsert } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const url = String(input.url ?? "").trim();
  const id = url ? parseYouTubeId(url) : null;
  if (!id) {
    errors.push("Enter a valid YouTube video URL.");
  }

  const titleEs = String(input.titleEs ?? "").trim();
  const titleEn = String(input.titleEn ?? "").trim() || titleEs;
  if (!titleEn && !titleEs) {
    errors.push("At least one title (English or Spanish) is required.");
  }

  const requestedPrivacy = String(input.privacyStatus ?? "public") as SiteVideoInsert["privacy_status"];
  const privacyStatus = privacyValues.has(requestedPrivacy) ? requestedPrivacy : "public";

  if (!id || errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    row: {
      title_en: titleEn,
      title_es: titleEs || titleEn,
      description: String(input.description ?? "").trim() || null,
      youtube_video_id: id,
      youtube_url: url.includes("/shorts/") ? `https://youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      embed_url: `https://www.youtube-nocookie.com/embed/${id}`,
      privacy_status: privacyStatus,
      is_visible: true
    }
  };
}
