export type PublicVideo = {
  id: string;
  title: string;
  youtubeVideoId: string;
  watchUrl: string;
  embedUrl: string;
  createdAt: string;
};

export type SiteVideoRow = {
  id: string;
  created_at: string;
  title_en: string;
  title_es: string;
  youtube_video_id: string;
  youtube_url: string;
  embed_url: string;
  privacy_status: "public" | "unlisted" | "private";
  is_visible: boolean;
};

export type YouTubeUploadConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type VideoPayload = {
  titleEn: string;
  titleEs: string;
  description: string;
  privacyStatus: "public" | "unlisted" | "private";
  file: File;
};

const maxVideoBytes = 200 * 1024 * 1024;
const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export function mapVideoRow(row: SiteVideoRow, locale: "en" | "es"): PublicVideo {
  return {
    id: row.id,
    title: locale === "es" ? row.title_es : row.title_en,
    youtubeVideoId: row.youtube_video_id,
    watchUrl: row.youtube_url,
    embedUrl: row.embed_url,
    createdAt: row.created_at
  };
}

export function parseVideoUploadPayload(payload: Record<string, FormDataEntryValue | undefined>) {
  const titleEn = String(payload.titleEn || "").trim();
  const titleEs = String(payload.titleEs || "").trim();
  const description = String(payload.description || "").trim();
  const privacyStatus = normalizePrivacyStatus(String(payload.privacyStatus || "public"));
  const file = payload.video;
  const errors: string[] = [];

  if (!titleEn) {
    errors.push("English title is required.");
  }

  if (!titleEs) {
    errors.push("Spanish title is required.");
  }

  if (!(file instanceof File) || file.size === 0) {
    errors.push("Video file is required.");
  } else {
    if (!allowedVideoTypes.has(file.type)) {
      errors.push("Use an MP4, MOV, or WebM video file.");
    }

    if (file.size > maxVideoBytes) {
      errors.push("Video must be 200 MB or smaller.");
    }
  }

  if (errors.length > 0 || !(file instanceof File)) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    value: {
      titleEn,
      titleEs,
      description,
      privacyStatus,
      file
    } satisfies VideoPayload
  };
}

export function getYouTubeUploadConfig(): YouTubeUploadConfig | null {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  return { clientId, clientSecret, refreshToken };
}

export async function uploadVideoToYouTube(payload: VideoPayload, config: YouTubeUploadConfig) {
  const accessToken = await fetchYouTubeAccessToken(config);
  const metadata = {
    snippet: {
      title: payload.titleEn,
      description: payload.description,
      categoryId: "22"
    },
    status: {
      privacyStatus: payload.privacyStatus,
      selfDeclaredMadeForKids: false
    }
  };
  const body = new FormData();
  body.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  body.append("video", payload.file, payload.file.name);

  const response = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error(`YouTube upload failed: ${await response.text()}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("YouTube did not return a video ID.");
  }

  return {
    youtubeVideoId: data.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${data.id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${data.id}`
  };
}

async function fetchYouTubeAccessToken(config: YouTubeUploadConfig) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`YouTube token refresh failed: ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google did not return a YouTube access token.");
  }

  return data.access_token;
}

function normalizePrivacyStatus(value: string): "public" | "unlisted" | "private" {
  return value === "unlisted" || value === "private" ? value : "public";
}
