const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && (serviceKey || publishableKey));
}

export function isSupabaseServiceConfigured() {
  return Boolean(url && serviceKey);
}

export async function insertRow<T extends Record<string, unknown>>(table: string, payload: T) {
  const key = serviceKey || publishableKey;
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${text}`);
  }

  return (await response.json()) as unknown[];
}

export async function insertServiceRow<T extends Record<string, unknown>>(table: string, payload: T) {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required.");
  }

  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase service insert failed: ${text}`);
  }

  return (await response.json()) as unknown[];
}

export async function selectServiceRows<T>(table: string, query = "") {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required.");
  }

  const suffix = query ? `?${query}` : "";
  const response = await fetch(`${url}/rest/v1/${table}${suffix}`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase service select failed: ${text}`);
  }

  return (await response.json()) as T[];
}

export async function updateServiceRows<T extends Record<string, unknown>>(table: string, query: string, payload: T) {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required.");
  }

  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase service update failed: ${text}`);
  }

  return (await response.json()) as unknown[];
}

export async function deleteServiceRows(table: string, query: string) {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required.");
  }

  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      prefer: "return=representation"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase service delete failed: ${text}`);
  }

  return (await response.json()) as unknown[];
}

export async function uploadReviewPhoto(file: File, path: string) {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required for private photo uploads.");
  }

  const bucket = process.env.SUPABASE_REVIEW_BUCKET || "review-headshots";
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": file.type || "image/webp",
      "x-upsert": "false"
    },
    body: file
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase upload failed: ${text}`);
  }

  return path;
}

export async function createReviewPhotoSignedUrl(path: string) {
  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is required for private photo display.");
  }

  const bucket = process.env.SUPABASE_REVIEW_BUCKET || "review-headshots";
  const response = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ expiresIn: 3600 })
  });

  if (!response.ok) {
    throw new Error(`Supabase signed URL failed: ${await response.text()}`);
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL || data.signedUrl;
  if (!signedPath) {
    throw new Error("Supabase did not return a signed review photo URL.");
  }

  return signedPath.startsWith("http") ? signedPath : `${url}/storage/v1${signedPath}`;
}

export type ApprovedReview = {
  id: string;
  name: string;
  rating: number;
  message: string;
  photo_path: string | null;
  created_at: string;
};

export type ApprovedReviewsSummary = {
  count: number;
  average: number | null;
};

// Site-wide rating summary (both languages, since language only marks which language a review
// was submitted in — not a translation of the same review) for aggregateRating structured data.
// Real counts/average only; returns count 0 / average null when no approved reviews are readable.
export async function getApprovedReviewsSummary(): Promise<ApprovedReviewsSummary> {
  const key = serviceKey || publishableKey;
  const empty: ApprovedReviewsSummary = { count: 0, average: null };
  if (!url || !key) {
    return empty;
  }

  const params = new URLSearchParams({
    select: "rating",
    status: "eq.approved",
    consent_to_publish: "eq.true",
    limit: "1000"
  });

  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/reviews?${params.toString()}`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`
      },
      next: { revalidate: 300 }
    });
  } catch (error) {
    console.error("Supabase approved reviews summary fetch failed", error);
    return empty;
  }

  if (!response.ok) {
    console.error(`Supabase approved reviews summary fetch failed: ${await response.text()}`);
    return empty;
  }

  const rows = (await response.json().catch(() => [])) as { rating: number }[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return empty;
  }

  const total = rows.reduce((sum, row) => sum + row.rating, 0);
  const average = Math.round((total / rows.length) * 10) / 10;
  return { count: rows.length, average };
}

export async function getApprovedReviews(language: "en" | "es") {
  const key = serviceKey || publishableKey;
  if (!url || !key) {
    return [];
  }

  const params = new URLSearchParams({
    select: "id,name,rating,message,photo_path,created_at",
    status: "eq.approved",
    consent_to_publish: "eq.true",
    language: `eq.${language}`,
    order: "created_at.desc",
    limit: "6"
  });

  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/reviews?${params.toString()}`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`
      },
      next: { revalidate: 300 }
    });
  } catch (error) {
    console.error("Supabase approved reviews fetch failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(`Supabase approved reviews fetch failed: ${await response.text()}`);
    return [];
  }

  return (await response.json().catch(() => [])) as ApprovedReview[];
}

export type ApprovedReviewsPage = {
  reviews: ApprovedReview[];
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
};

// Paginated approved+consented reviews for the /reviews page. Fetches one extra row to detect a next page.
export async function getApprovedReviewsPage(
  language: "en" | "es",
  page: number,
  pageSize = 12
): Promise<ApprovedReviewsPage> {
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const offset = (safePage - 1) * pageSize;
  const empty: ApprovedReviewsPage = { reviews: [], page: safePage, hasPrev: safePage > 1, hasNext: false };

  const key = serviceKey || publishableKey;
  if (!url || !key) {
    return empty;
  }

  const params = new URLSearchParams({
    select: "id,name,rating,message,photo_path,created_at",
    status: "eq.approved",
    consent_to_publish: "eq.true",
    language: `eq.${language}`,
    order: "created_at.desc",
    offset: String(offset),
    limit: String(pageSize + 1)
  });

  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/reviews?${params.toString()}`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      next: { revalidate: 300 }
    });
  } catch (error) {
    console.error("Supabase reviews page fetch failed", error);
    return empty;
  }

  if (!response.ok) {
    console.error(`Supabase reviews page fetch failed: ${await response.text()}`);
    return empty;
  }

  const rows = (await response.json().catch(() => [])) as ApprovedReview[];
  return {
    reviews: rows.slice(0, pageSize),
    page: safePage,
    hasPrev: safePage > 1,
    hasNext: rows.length > pageSize
  };
}

export async function getPublicSiteVideos() {
  const key = serviceKey || publishableKey;
  if (!url || !key) {
    return [];
  }

  const params = new URLSearchParams({
    select: "id,created_at,title_en,title_es,youtube_video_id,youtube_url,embed_url,privacy_status,is_visible",
    is_visible: "eq.true",
    privacy_status: "in.(public,unlisted)",
    order: "created_at.desc",
    limit: "6"
  });

  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/site_videos?${params.toString()}`, {
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`
      },
      next: { revalidate: 300 }
    });
  } catch (error) {
    console.error("Supabase public videos fetch failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(`Supabase public videos fetch failed: ${await response.text()}`);
    return [];
  }

  const rows = (await response.json().catch(() => [])) as import("@/lib/video-records").SiteVideoRow[];
  const availability = await Promise.all(rows.map((row) => isYouTubeVideoAvailable(row.youtube_url)));
  return rows.filter((_, index) => availability[index]);
}

export async function isYouTubeVideoAvailable(videoUrl: string) {
  const params = new URLSearchParams({
    url: videoUrl,
    format: "json"
  });

  try {
    const response = await fetch(`https://www.youtube.com/oembed?${params.toString()}`, {
      next: { revalidate: 21600 }
    });
    return response.ok;
  } catch (error) {
    console.error(`YouTube video availability check failed: ${error instanceof Error ? error.message : String(error)}`);
    return true;
  }
}
