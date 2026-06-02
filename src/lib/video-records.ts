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

export type AdminSiteVideo = SiteVideoRow & {
  youtubeAvailable: boolean;
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
  serviceFocus: VideoServiceFocus;
  privacyStatus: "public" | "unlisted" | "private";
  file: File;
};

export const maxVideoBytes = 75 * 1024 * 1024;
const maxMultipartOverheadBytes = 1024 * 1024;
const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const videoServiceFocuses = [
  "kitchen_cleaning",
  "bathroom_cleaning",
  "deep_cleaning",
  "recurring_cleaning",
  "post_construction_cleaning",
  "small_business_cleaning",
  "house_cleaning",
  "apartment_condo_cleaning"
] as const;
type VideoServiceFocus = "" | (typeof videoServiceFocuses)[number];

const serviceFocusMetadata: Record<Exclude<VideoServiceFocus, "">, { label: string; hashtag: string; tag: string }> = {
  kitchen_cleaning: { label: "kitchen cleaning", hashtag: "#KitchenCleaning", tag: "kitchen cleaning" },
  bathroom_cleaning: { label: "bathroom cleaning", hashtag: "#BathroomCleaning", tag: "bathroom cleaning" },
  deep_cleaning: { label: "deep cleaning", hashtag: "#DeepCleaning", tag: "deep cleaning" },
  recurring_cleaning: { label: "recurring cleaning", hashtag: "#RecurringCleaning", tag: "recurring cleaning" },
  post_construction_cleaning: {
    label: "post-construction cleaning",
    hashtag: "#PostConstructionCleaning",
    tag: "post-construction cleaning"
  },
  small_business_cleaning: {
    label: "small business cleaning",
    hashtag: "#SmallBusinessCleaning",
    tag: "small business cleaning"
  },
  house_cleaning: { label: "house cleaning", hashtag: "#HouseCleaning", tag: "house cleaning" },
  apartment_condo_cleaning: {
    label: "apartment and condo cleaning",
    hashtag: "#ApartmentCleaning",
    tag: "apartment cleaning"
  }
};

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

export function mapAdminVideoRow(row: SiteVideoRow, youtubeAvailable = true): AdminSiteVideo {
  return {
    ...row,
    youtubeAvailable
  };
}

export function parseVideoUploadPayload(payload: Record<string, FormDataEntryValue | undefined>) {
  const fallbackTitle = "Video de Medina Clean";
  const titleEs = String(payload.titleEs || "").trim() || fallbackTitle;
  const titleEn = String(payload.titleEn || "").trim() || titleEs;
  const description = String(payload.description || "").trim();
  const serviceFocus = normalizeServiceFocus(String(payload.serviceFocus || ""));
  const privacyStatus = normalizePrivacyStatus(String(payload.privacyStatus || "public"));
  const file = payload.video;
  const errors: string[] = [];

  if (!(file instanceof File) || file.size === 0) {
    errors.push("Video file is required.");
  } else {
    if (!allowedVideoTypes.has(file.type)) {
      errors.push("Use an MP4, MOV, or WebM video file.");
    }

    if (file.size > maxVideoBytes) {
      errors.push("Video must be 75 MB or smaller for this admin upload.");
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
      serviceFocus,
      privacyStatus,
      file
    } satisfies VideoPayload
  };
}

export function isVideoUploadRequestTooLarge(contentLength: string | null) {
  if (!contentLength) {
    return false;
  }

  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > maxVideoBytes + maxMultipartOverheadBytes;
}

export function buildYouTubeVideoDescription(description: string, serviceFocus: VideoServiceFocus) {
  const focus = serviceFocus ? `Video focus: ${serviceFocusMetadata[serviceFocus].label}.` : "";
  const hashtags = [
    "#Shorts",
    "#MedinaClean",
    "#WoodstockGA",
    "#HouseCleaning",
    "#DeepCleaning",
    "#CleaningService",
    serviceFocus ? serviceFocusMetadata[serviceFocus].hashtag : ""
  ]
    .filter(Boolean)
    .join(" ");

  return [
    description.trim(),
    focus,
    "Medina Clean provides house, apartment, condo, deep, recurring, small business, and post-construction cleaning near Woodstock, Marietta, Kennesaw, Acworth, Canton, and Roswell, GA.",
    "Schedule or request an estimate: https://medinaclean.com/en#schedule",
    "Servicio en español: https://medinaclean.com/es#schedule",
    hashtags
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace("GA.\n\nSchedule", "GA.\nSchedule")
    .replace("schedule\n\nServicio", "schedule\nServicio");
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
      description: buildYouTubeVideoDescription(payload.description, payload.serviceFocus),
      tags: buildYouTubeVideoTags(payload.serviceFocus),
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

export function buildYouTubeVideoTags(serviceFocus: VideoServiceFocus) {
  return [
    "Shorts",
    "Medina Clean",
    "Woodstock GA cleaning",
    "house cleaning",
    "deep cleaning",
    serviceFocus ? serviceFocusMetadata[serviceFocus].tag : ""
  ].filter(Boolean);
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

function normalizeServiceFocus(value: string): VideoServiceFocus {
  return videoServiceFocuses.includes(value as Exclude<VideoServiceFocus, "">)
    ? (value as Exclude<VideoServiceFocus, "">)
    : "";
}
