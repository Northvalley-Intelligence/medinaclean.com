export const adminSessionCookie = "rosa_admin_session";

const maxAgeSeconds = 60 * 60 * 24 * 7;

export function isAdminConfigured() {
  return Boolean(process.env.ROSA_ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function createAdminSession(password: string, now = Date.now()) {
  if (!isAdminConfigured()) {
    return { ok: false as const, reason: "Admin authentication is not configured." };
  }

  if (!constantTimeEqual(password, process.env.ROSA_ADMIN_PASSWORD || "")) {
    return { ok: false as const, reason: "Invalid password." };
  }

  const timestamp = String(now);
  const signature = await sign(timestamp, process.env.ADMIN_SESSION_SECRET || "");
  return {
    ok: true as const,
    cookie: `${timestamp}.${signature}`,
    maxAgeSeconds
  };
}

export async function verifyAdminSession(cookieValue: string | undefined, now = Date.now()) {
  if (!isAdminConfigured() || !cookieValue) {
    return false;
  }

  const [timestamp, signature] = cookieValue.split(".");
  const createdAt = Number(timestamp);
  if (!timestamp || !signature || !Number.isFinite(createdAt)) {
    return false;
  }

  if (now - createdAt > maxAgeSeconds * 1000) {
    return false;
  }

  const expected = await sign(timestamp, process.env.ADMIN_SESSION_SECRET || "");
  return constantTimeEqual(signature, expected);
}

export async function isAdminRequest(request: Request) {
  return verifyAdminSession(readCookie(request.headers.get("cookie"), adminSessionCookie));
}

function readCookie(header: string | null, name: string) {
  return (
    header
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

async function sign(value: string, secret: string) {
  const encoder = new TextEncoder();
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error("WebCrypto is not available for admin session signing.");
  }

  const key = await webCrypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await webCrypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}
