export async function verifyTurnstileToken({
  token,
  clientIp,
  env = process.env
}: {
  token: string;
  clientIp: string;
  env?: NodeJS.ProcessEnv;
}) {
  const secret = clean(env.TURNSTILE_SECRET_KEY, 1000);

  if (!secret) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false };
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: clientIp
    }),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = (await response.json().catch(() => ({}))) as { success?: boolean };
  return { ok: data.success === true };
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
