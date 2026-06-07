type SiteNotification = {
  subject: string;
  text: string;
};

export async function sendSiteNotification(notification: SiteNotification, env = process.env) {
  const apiKey = clean(env.RESEND_API_KEY, 1000);
  const notifyTo = clean(env.SITE_NOTIFY_TO || env.CHAT_NOTIFY_TO || env.ASSESSMENT_HOST_EMAIL, 240);
  const notifyFrom = clean(env.SITE_NOTIFY_FROM || env.CHAT_NOTIFY_FROM, 240) || "Medina Clean <alerts@northvalleyintel.com>";

  if (!apiKey || !notifyTo) {
    return { sent: false, reason: "not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: notifyFrom,
      to: [notifyTo],
      subject: notification.subject,
      text: notification.text
    }),
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) {
    throw new Error(`Resend notification failed: ${await response.text()}`);
  }

  return { sent: true as const };
}

export async function trySendSiteNotification(notification: SiteNotification, env = process.env) {
  try {
    return await sendSiteNotification(notification, env);
  } catch (error) {
    console.error("Site notification failed", error);
    return { sent: false, reason: "send_failed" as const };
  }
}

export function buildChatNotificationText(input: {
  locale: string;
  message: string;
  turnIndex: number;
  reply: string;
  mode: string;
  provider: string;
  model: string;
}) {
  return [
    "A Medina Clean website visitor used the chat estimate.",
    "",
    `Language: ${input.locale}`,
    `Turn: ${input.turnIndex}`,
    `Mode: ${input.mode}`,
    `Provider: ${input.provider}`,
    `Model: ${input.model}`,
    "",
    "Visitor message:",
    input.message,
    "",
    "Assistant reply:",
    input.reply
  ].join("\n");
}

export function buildAppointmentNotificationText(input: {
  language: string;
  name: string;
  phone: string;
  address: string;
  zipCode: string;
  serviceType: string;
  bedrooms: number;
  bathrooms: number;
  preferredTimes: string[];
  notes?: string | null;
  source: string;
}) {
  return [
    "A Medina Clean website appointment request was submitted.",
    "",
    `Source: ${input.source}`,
    `Language: ${input.language}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Address: ${input.address}`,
    `ZIP: ${input.zipCode}`,
    `Service: ${input.serviceType}`,
    `Bedrooms: ${input.bedrooms}`,
    `Bathrooms: ${input.bathrooms}`,
    `Preferred time 1: ${input.preferredTimes[0]}`,
    `Preferred time 2: ${input.preferredTimes[1]}`,
    `Preferred time 3: ${input.preferredTimes[2]}`,
    "",
    `Notes: ${input.notes || "None"}`
  ].join("\n");
}

export function buildReviewNotificationText(input: {
  language: string;
  name: string;
  rating: number;
  message: string;
  hasPhoto: boolean;
}) {
  return [
    "A Medina Clean website review was submitted and is pending approval.",
    "",
    `Language: ${input.language}`,
    `Name: ${input.name}`,
    `Rating: ${input.rating}`,
    `Photo: ${input.hasPhoto ? "Yes" : "No"}`,
    "",
    "Review:",
    input.message
  ].join("\n");
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
