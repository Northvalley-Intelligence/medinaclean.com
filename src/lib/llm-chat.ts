import { calculateCleaningEstimate, normalizeChatFrequency, type ChatFrequency, type CleaningAddOnInput } from "./chat-agent";
import { extractZip, validateServiceArea } from "./service-area";

export type ChatLocale = "en" | "es";

export type ChatEstimateRequest = {
  message: string;
  locale: ChatLocale;
  turnIndex: number;
};

export type ChatEstimateResponse = {
  reply: string;
  mode: "llm" | "deterministic_fallback";
  provider: string;
  model: string;
};

export type ChatModelConfig = {
  enabled: boolean;
  provider: string;
  model: string;
  mode: "free_api" | "paid_api" | "local";
  baseUrl: string;
  apiKey?: string;
  appUrl?: string;
  appTitle?: string;
};

export type OpenAiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
};

export type ChatUsageEvent = {
  feature: "website_chat";
  provider: string;
  model: string;
  mode: "free_api" | "paid_api" | "local";
  request_type: "client_chat";
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
  success: boolean;
  error_code: string | null;
  metadata: Record<string, unknown>;
};

export function normalizeChatEstimateRequest(body: unknown): ChatEstimateRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const message = clean(record.message, 1000);
  if (!message) {
    return null;
  }

  return {
    message,
    locale: record.locale === "es" ? "es" : "en",
    turnIndex: normalizeTurnIndex(record.turnIndex)
  };
}

export function getChatModelConfig(env: NodeJS.ProcessEnv): ChatModelConfig {
  const baseUrl = clean(env.AI_CHAT_BASE_URL, 240);
  const model = clean(env.AI_CHAT_MODEL, 120) || "deterministic-fallback";
  const provider = clean(env.AI_CHAT_PROVIDER, 80) || inferProvider(baseUrl);
  const mode = env.AI_CHAT_MODE === "paid_api" || env.AI_CHAT_MODE === "local" ? env.AI_CHAT_MODE : "free_api";

  return {
    enabled: env.AI_CHAT_ENABLED === "true" && Boolean(baseUrl),
    provider,
    model,
    mode,
    baseUrl,
    apiKey: getProviderApiKey(env, provider),
    appUrl: clean(env.AI_CHAT_APP_URL || env.NEXT_PUBLIC_SITE_URL, 240) || undefined,
    appTitle: clean(env.AI_CHAT_APP_TITLE, 80) || "Medina Clean"
  };
}

export function getChatModelAttemptConfigs(env: NodeJS.ProcessEnv, turnIndex: number) {
  if (env.AI_CHAT_ENABLED !== "true") {
    return [];
  }

  const providers = clean(env.AI_CHAT_PROVIDER_CHAIN, 160)
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);

  const chain = providers.length > 0 ? providers.map((provider) => getNamedProviderConfig(env, provider)) : [getChatModelConfig(env)];
  const enabledConfigs = chain.filter((config) => config.enabled && config.baseUrl && config.model);
  if (enabledConfigs.length < 2) {
    return enabledConfigs;
  }

  const startIndex = Math.abs(turnIndex) % enabledConfigs.length;
  return [...enabledConfigs.slice(startIndex), ...enabledConfigs.slice(0, startIndex)];
}

function getNamedProviderConfig(env: NodeJS.ProcessEnv, provider: string): ChatModelConfig {
  if (provider === "gemini") {
    const baseUrl = clean(env.GEMINI_BASE_URL, 240) || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    return {
      enabled: Boolean(clean(env.GEMINI_API_KEY, 1000)),
      provider: "gemini",
      model: clean(env.GEMINI_MODEL, 120) || "gemini-2.5-flash",
      mode: env.AI_CHAT_MODE === "paid_api" || env.AI_CHAT_MODE === "local" ? env.AI_CHAT_MODE : "free_api",
      baseUrl,
      apiKey: clean(env.GEMINI_API_KEY, 1000) || undefined,
      appUrl: clean(env.AI_CHAT_APP_URL || env.NEXT_PUBLIC_SITE_URL, 240) || undefined,
      appTitle: clean(env.AI_CHAT_APP_TITLE, 80) || "Medina Clean"
    };
  }

  if (provider === "openrouter") {
    const baseUrl =
      clean(env.OPENROUTER_BASE_URL, 240) ||
      (clean(env.AI_CHAT_PROVIDER, 80) === "openrouter" ? clean(env.AI_CHAT_BASE_URL, 240) : "") ||
      "https://openrouter.ai/api/v1/chat/completions";
    return {
      enabled: Boolean(clean(env.OPENROUTER_API_KEY, 1000)),
      provider: "openrouter",
      model: clean(env.OPENROUTER_MODEL || env.AI_CHAT_MODEL, 120) || "liquid/lfm-2.5-1.2b-instruct:free",
      mode: env.AI_CHAT_MODE === "paid_api" || env.AI_CHAT_MODE === "local" ? env.AI_CHAT_MODE : "free_api",
      baseUrl,
      apiKey: clean(env.OPENROUTER_API_KEY, 1000) || undefined,
      appUrl: clean(env.AI_CHAT_APP_URL || env.NEXT_PUBLIC_SITE_URL, 240) || undefined,
      appTitle: clean(env.AI_CHAT_APP_TITLE, 80) || "Medina Clean"
    };
  }

  return getChatModelConfig({ ...env, AI_CHAT_PROVIDER: provider } as NodeJS.ProcessEnv);
}

function getProviderApiKey(env: NodeJS.ProcessEnv, provider: string) {
  const genericKey = clean(env.AI_CHAT_API_KEY, 1000);
  if (genericKey) {
    return genericKey;
  }

  if (provider === "gemini") {
    return clean(env.GEMINI_API_KEY, 1000) || undefined;
  }

  if (provider === "openrouter") {
    return clean(env.OPENROUTER_API_KEY, 1000) || undefined;
  }

  return undefined;
}

export function buildProviderHeaders(config: ChatModelConfig) {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (config.apiKey) {
    headers.authorization = `Bearer ${config.apiKey}`;
  }

  if (config.provider === "openrouter") {
    if (config.appUrl) {
      headers["HTTP-Referer"] = config.appUrl;
    }
    if (config.appTitle) {
      headers["X-Title"] = config.appTitle;
    }
  }

  return headers;
}

export function buildFallbackChatResponse(request: ChatEstimateRequest): ChatEstimateResponse {
  return {
    reply: buildDeterministicReply(request.message, request.locale),
    mode: "deterministic_fallback",
    provider: "rules",
    model: "deterministic-chat-estimator"
  };
}

export function shouldUseDeterministicPricing(reply: string) {
  return (
    reply.includes("Rough estimate:") ||
    reply.includes("Rough one-time estimate:") ||
    reply.includes("Estimado aproximado:") ||
    reply.includes("Estimado aproximado de una vez:") ||
    reply.includes("Post-construction cleanup requires") ||
    reply.includes("La limpieza después de construcción requiere") ||
    reply.includes("outside the service area") ||
    reply.includes("fuera del área de servicio") ||
    reply.includes("standard cleaning materials") ||
    reply.includes("materiales de limpieza estándar")
  );
}

export function shouldRejectModelReply(reply: string) {
  return /example\.com|replace with actual|eco-friendly|non-toxic|safe for people and pets|\[[^\]]+\]/i.test(reply);
}

export function buildOpenAiChatRequest(message: string, locale: ChatLocale, model: string) {
  return {
    model,
    temperature: 0.2,
    max_tokens: 260,
    messages: [
      {
        role: "system",
        content:
          "You are Medina Clean's bilingual website assistant. Keep replies concise. Do not invent prices. Use these rules: every 2 weeks is $30 per bedroom plus bathroom; every 3 weeks is $40 per bedroom plus bathroom; first-time or one-time cleaning is double the matching recurring estimate; oven and refrigerator add-on is $50 standard or $80 if very dirty; post-construction cleanup requires onsite inspection. Rosa confirms the final amount after seeing the property. If the customer wants to book, tell them to use the guided form below."
      },
      {
        role: "user",
        content: `Locale: ${locale}\nCustomer message, with contact details redacted when present:\n${redactSensitiveText(message)}`
      }
    ]
  };
}

export function parseOpenAiChatResponse(data: unknown) {
  const record = data as { choices?: Array<{ message?: { content?: unknown } }>; usage?: OpenAiUsage };
  const content = clean(record.choices?.[0]?.message?.content, 1200);
  if (!content) {
    throw new Error("empty_model_response");
  }

  return {
    content,
    usage: record.usage || {}
  };
}

export function buildUsageEvent({
  config,
  usage,
  latencyMs,
  success,
  errorCode,
  fallbackUsed
}: {
  config: ChatModelConfig;
  usage?: OpenAiUsage;
  latencyMs: number;
  success: boolean;
  errorCode: string | null;
  fallbackUsed: boolean;
}): ChatUsageEvent {
  return {
    feature: "website_chat",
    provider: config.provider,
    model: config.model,
    mode: config.mode,
    request_type: "client_chat",
    input_tokens: usage?.prompt_tokens || 0,
    output_tokens: usage?.completion_tokens || 0,
    cached_input_tokens: usage?.prompt_tokens_details?.cached_tokens || 0,
    estimated_cost_usd: 0,
    latency_ms: latencyMs,
    success,
    error_code: errorCode,
    metadata: { fallback_used: fallbackUsed }
  };
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, "[phone]")
    .replace(/\b\d{2,6}\s+[A-Za-z0-9 .'-]{3,80}(street|st|road|rd|drive|dr|lane|ln|avenue|ave|court|ct|circle|cir)\b/gi, "[street address]");
}

function buildDeterministicReply(message: string, locale: ChatLocale) {
  const parsed = parseEstimateMessage(message);
  const zip = extractZip(message);
  const serviceArea = zip ? validateServiceArea(zip) : null;
  const intro =
    locale === "es"
      ? "Puedo ayudar con un estimado rápido usando las reglas de Rosa."
      : "I can help with a quick estimate using Rosa's rules.";
  const fallback =
    locale === "es"
      ? "Use el formulario guiado abajo para enviar sus datos de contacto a Rosa. Después de enviarlo, aparecerá el botón para descargar el PDF del estimado."
      : "Use the guided form below to send Rosa your contact details. After you send it, the estimate PDF download button will appear.";

  const factualReply = buildFactualReply(message, locale);
  if (factualReply) {
    return factualReply;
  }

  const zipLine = serviceArea
    ? serviceArea.ok
      ? locale === "es"
        ? `El ZIP ${zip} está dentro del área automática.`
        : `ZIP ${zip} is inside the automatic service area.`
      : locale === "es"
        ? `El ZIP ${zip} parece estar fuera del área automática; Rosa puede revisarlo manualmente.`
        : `ZIP ${zip} appears outside the automatic service area; Rosa can review it manually.`
    : "";

  if (!parsed) {
    return [intro, zipLine, fallback].filter(Boolean).join(" ");
  }

  const estimate = calculateCleaningEstimate({
    bedrooms: parsed.bedrooms,
    bathrooms: parsed.bathrooms,
    frequency: parsed.frequency,
    addOns: parsed.addOns
  });

  const priceLine =
    parsed.frequency === "post_construction"
      ? locale === "es"
        ? "La limpieza después de construcción requiere inspección en persona antes de dar precio."
        : "Post-construction cleanup requires an onsite inspection before Rosa gives a price."
      : estimate.recurringEstimateUsd
        ? locale === "es"
          ? `Estimado aproximado: primera limpieza $${estimate.recurringEstimateUsd * 2}; recurrente $${estimate.recurringEstimateUsd} (${frequencyLabel(parsed.frequency)}).`
          : `Rough estimate: first cleaning $${estimate.recurringEstimateUsd * 2}; recurring $${estimate.recurringEstimateUsd} (${frequencyLabel(parsed.frequency)}).`
        : locale === "es"
          ? `Estimado aproximado de una vez: $${estimate.oneTimeEstimateUsd}.`
          : `Rough one-time estimate: $${estimate.oneTimeEstimateUsd}.`;

  return [priceLine, zipLine, locale === "es" ? "Rosa confirma el monto final después de ver la propiedad." : "Rosa confirms the final amount after seeing the property.", fallback]
    .filter(Boolean)
    .join(" ");
}

function parseEstimateMessage(message: string) {
  const normalized = message.toLowerCase();
  const bedrooms = findNumberBefore(normalized, /(bed|bedroom|bedrooms|habitaci[oó]n|habitaciones|cuarto|cuartos)/);
  const bathrooms = findNumberBefore(normalized, /(bath|bathroom|bathrooms|baño|banos|baños)/);
  if (!bedrooms || !bathrooms) {
    return null;
  }

  const frequency: ChatFrequency = normalizeChatFrequency(normalized);
  const addOns: CleaningAddOnInput[] = /oven|fridge|refrigerator|horno|refrigerador/.test(normalized)
    ? [{ type: "oven_and_fridge", condition: /very dirty|muy sucio|heavy|fuerte/.test(normalized) ? "very_dirty" : "standard" }]
    : [];

  return { bedrooms, bathrooms, frequency, addOns };
}

function buildFactualReply(message: string, locale: ChatLocale) {
  const normalized = message.toLowerCase();

  if (/los angeles|los angels|california|\bca\b/.test(normalized)) {
    return locale === "es"
      ? "Medina Clean atiende principalmente cerca de Woodstock, GA y el ZIP 30188. Los Angeles, California está fuera del área de servicio; Rosa no puede confirmar limpieza allí desde este sitio."
      : "Medina Clean mainly serves the Woodstock, GA area near ZIP 30188. Los Angeles, California is outside the service area, so Rosa cannot confirm cleaning there from this site.";
  }

  if (/material|materials|suppl|product|products|qu[ií]mico|limpieza usa|materiales|productos/.test(normalized)) {
    return locale === "es"
      ? "Los precios iniciales asumen que Rosa trae materiales de limpieza estándar. Si usted quiere productos especiales, Rosa puede revisarlo y el precio puede cambiar."
      : "Starting rates assume Rosa brings standard cleaning materials. If you want special products used, Rosa can review that request and the price may change.";
  }

  if (/book|schedule|appointment|cita|agendar|programar/.test(normalized)) {
    return locale === "es"
      ? "Use el estimado guiado abajo para enviar sus horarios preferidos a Rosa. Rosa revisará el calendario y confirmará directamente."
      : "Use the guided estimate below to send Rosa your preferred times. Rosa will review the calendar and confirm directly.";
  }

  return "";
}

function findNumberBefore(value: string, label: RegExp) {
  const match = value.match(new RegExp(`(\\d+(?:\\.5)?)\\s*(?:${label.source})`));
  if (!match) {
    return null;
  }

  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

function frequencyLabel(frequency: ChatFrequency) {
  if (frequency === "every_2_weeks") {
    return "every 2 weeks";
  }

  if (frequency === "every_3_weeks") {
    return "every 3 weeks";
  }

  return "one-time";
}

function inferProvider(baseUrl: string) {
  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    return "ollama";
  }

  if (baseUrl.includes("openrouter.ai")) {
    return "openrouter";
  }

  if (baseUrl.includes("generativelanguage.googleapis.com")) {
    return "gemini";
  }

  return baseUrl ? "openai_compatible" : "rules";
}

function normalizeTurnIndex(value: unknown) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    return 0;
  }

  return Math.min(number, 1000);
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
