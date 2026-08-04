// GEN-001 TASK-014 — IndexNow submission helper. Lets the site notify Bing/Yandex/etc. when URLs
// change. Disabled (no-op) until INDEXNOW_KEY is provisioned as an env secret and the matching key
// file is published at https://<host>/<key>.txt (both provisioned by Ferosh as infra).

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export function buildIndexNowPayload(
  urls: string[],
  config: { key: string; host: string; keyLocation?: string }
): IndexNowPayload {
  return {
    host: config.host,
    key: config.key,
    keyLocation: config.keyLocation ?? `https://${config.host}/${config.key}.txt`,
    urlList: urls
  };
}

export async function submitToIndexNow(
  urls: string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<{ ok: boolean; skipped?: boolean; status?: number }> {
  const key = env.INDEXNOW_KEY;
  const host = env.INDEXNOW_HOST || "medinaclean.com";

  if (!key || urls.length === 0) {
    return { ok: true, skipped: true };
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildIndexNowPayload(urls, { key, host })),
    signal: AbortSignal.timeout(5000)
  });

  return { ok: response.ok, status: response.status };
}
