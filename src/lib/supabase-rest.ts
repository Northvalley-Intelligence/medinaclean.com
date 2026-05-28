const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && (serviceKey || publishableKey));
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
