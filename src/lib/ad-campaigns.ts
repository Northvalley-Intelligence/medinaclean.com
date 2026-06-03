import type { AdminLocale } from "./admin-i18n";

export const defaultAdZipCodes = ["30188", "30189", "30066", "30144", "30102", "30114"] as const;

export type AdPlatform = "instagram" | "facebook";

export type AdPlanInput = {
  campaignName: string;
  dailyBudgetUsd: string;
  zipCodes: string;
  platforms: AdPlatform[];
};

export type AdPlan = {
  campaignName: string;
  dailyBudgetUsd: number;
  zipCodes: string[];
  platforms: AdPlatform[];
};

export type MetaAdsConfig = {
  accessToken: string;
  adAccountId: string;
  pageId: string;
  instagramActorId?: string;
  apiVersion: string;
};

export type MetaAdDraft = ReturnType<typeof buildMetaAdDraft>;

export type MetaAdsReadiness = {
  account: {
    id: string;
    name: string;
    status: "active" | "not_active" | "unknown";
    currency: string;
  };
  page: {
    id: string;
    name: string;
  };
  instagram?: {
    id: string;
    username?: string;
  };
};

const defaultMetaApiVersion = "v24.0";

const platformSet = new Set<AdPlatform>(["instagram", "facebook"]);

export function buildAdPlan(input: AdPlanInput): { ok: false; errors: string[] } | { ok: true; plan: AdPlan } {
  const campaignName = input.campaignName.trim();
  const dailyBudgetUsd = Number(input.dailyBudgetUsd);
  const zipCodes = normalizeZipCodes(input.zipCodes);
  const platforms = normalizePlatforms(input.platforms);
  const errors: string[] = [];

  if (!campaignName) {
    errors.push("Campaign name is required.");
  }

  if (!Number.isFinite(dailyBudgetUsd) || dailyBudgetUsd < 5 || dailyBudgetUsd > 250) {
    errors.push("Daily budget must be between $5 and $250.");
  }

  if (zipCodes.length === 0) {
    errors.push("Add at least one 5-digit ZIP code.");
  }

  if (platforms.length === 0) {
    errors.push("Choose Instagram, Facebook, or both.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    plan: {
      campaignName,
      dailyBudgetUsd: Math.round(dailyBudgetUsd * 100) / 100,
      zipCodes,
      platforms
    }
  };
}

export function buildAdChatLandingUrl(input: {
  baseUrl: string;
  locale: AdminLocale;
  campaignName: string;
  zipCodes: string[];
  platforms: AdPlatform[];
}) {
  const baseUrl = input.baseUrl.replace(/\/$/, "") || "https://medinaclean.com";
  const locale = input.locale === "en" ? "en" : "es";
  const campaign = slugify(input.campaignName || "medina-clean-ad");
  const platforms = normalizePlatforms(input.platforms);
  const zipCodes = normalizeZipCodes(input.zipCodes.join(","));
  const params = new URLSearchParams({
    utm_source: "meta",
    utm_medium: "paid_social",
    utm_campaign: campaign,
    utm_content: platforms.length > 0 ? platforms.join("-") : "meta",
    zip: zipCodes[0] || defaultAdZipCodes[0]
  });

  return `${baseUrl}/${locale}?${params.toString()}#chat`;
}

export function buildMetaAdDraft(input: { plan: AdPlan; locale: AdminLocale; baseUrl: string; config?: MetaAdsConfig }) {
  const landingUrl = buildAdChatLandingUrl({
    baseUrl: input.baseUrl,
    locale: input.locale,
    campaignName: input.plan.campaignName,
    zipCodes: input.plan.zipCodes,
    platforms: input.plan.platforms
  });
  const pageId = input.config?.pageId || "{{META_PAGE_ID}}";
  const instagramActorId = input.config?.instagramActorId;

  const objectStorySpec: Record<string, unknown> = {
    page_id: pageId,
    link_data: {
      link: landingUrl,
      message:
        input.locale === "es"
          ? "Limpieza de casas con Medina Clean cerca de Woodstock. Pida un estimado por chat."
          : "House cleaning with Medina Clean near Woodstock. Request an estimate by chat.",
      name: input.locale === "es" ? "Pida un estimado de limpieza" : "Request a cleaning estimate",
      description:
        input.locale === "es"
          ? "Rosa revisa sus datos y disponibilidad antes de confirmar."
          : "Rosa reviews your details and availability before confirming.",
      call_to_action: {
        type: "GET_QUOTE",
        value: {
          link: landingUrl
        }
      }
    }
  };

  if (instagramActorId) {
    objectStorySpec.instagram_actor_id = instagramActorId;
  }

  return {
    landingUrl,
    campaign: {
      name: input.plan.campaignName,
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: []
    },
    adSet: {
      name: `${input.plan.campaignName} ZIP targeting`,
      daily_budget: Math.round(input.plan.dailyBudgetUsd * 100),
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      destination_type: "WEBSITE",
      targeting: {
        geo_locations: {
          zips: input.plan.zipCodes.map((zip) => ({ key: `US:${zip}` }))
        },
        publisher_platforms: input.plan.platforms.map((platform) => (platform === "instagram" ? "instagram" : "facebook"))
      },
      status: "PAUSED"
    },
    creative: {
      name: `${input.plan.campaignName} chat creative`,
      object_story_spec: objectStorySpec
    },
    ad: {
      name: `${input.plan.campaignName} chat ad`,
      status: "PAUSED"
    }
  };
}

export function getMetaAdsConfig(env: Record<string, string | undefined> = process.env) {
  const missing: string[] = [];
  if (env.META_ADS_LIVE_ENABLED !== "true") {
    missing.push("META_ADS_LIVE_ENABLED");
  }
  if (!env.META_ACCESS_TOKEN) {
    missing.push("META_ACCESS_TOKEN");
  }
  if (!env.META_AD_ACCOUNT_ID) {
    missing.push("META_AD_ACCOUNT_ID");
  }
  if (!env.META_PAGE_ID) {
    missing.push("META_PAGE_ID");
  }

  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  return {
    ok: true as const,
    config: {
      accessToken: env.META_ACCESS_TOKEN || "",
      adAccountId: env.META_AD_ACCOUNT_ID || "",
      pageId: env.META_PAGE_ID || "",
      instagramActorId: env.META_INSTAGRAM_ACTOR_ID || undefined,
      apiVersion: env.META_API_VERSION || defaultMetaApiVersion
    }
  };
}

export async function inspectMetaAdsReadiness(config: MetaAdsConfig): Promise<MetaAdsReadiness> {
  const graphBaseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  const accountParams = new URLSearchParams({
    fields: "id,name,account_status,currency",
    access_token: config.accessToken
  });
  const pageParams = new URLSearchParams({
    fields: "id,name,instagram_business_account{id,username}",
    access_token: config.accessToken
  });
  const [account, page] = await Promise.all([
    fetchMetaObject<{
      id?: string;
      name?: string;
      account_status?: number;
      currency?: string;
    }>(`${graphBaseUrl}/${config.adAccountId}?${accountParams.toString()}`),
    fetchMetaObject<{
      id?: string;
      name?: string;
      instagram_business_account?: { id?: string; username?: string };
    }>(`${graphBaseUrl}/${config.pageId}?${pageParams.toString()}`)
  ]);

  const instagram = page.instagram_business_account?.id
    ? { id: page.instagram_business_account.id, username: page.instagram_business_account.username }
    : undefined;

  return {
    account: {
      id: account.id || config.adAccountId,
      name: account.name || config.adAccountId,
      status: account.account_status === 1 ? "active" : account.account_status ? "not_active" : "unknown",
      currency: account.currency || "unknown"
    },
    page: {
      id: page.id || config.pageId,
      name: page.name || config.pageId
    },
    instagram
  };
}

export async function publishPausedMetaAdDraft(input: { draft: MetaAdDraft; config: MetaAdsConfig }) {
  const graphBaseUrl = `https://graph.facebook.com/${input.config.apiVersion}`;
  const campaign = await postMetaObject(`${graphBaseUrl}/${input.config.adAccountId}/campaigns`, {
    ...input.draft.campaign,
    access_token: input.config.accessToken
  });
  const adSet = await postMetaObject(`${graphBaseUrl}/${input.config.adAccountId}/adsets`, {
    ...input.draft.adSet,
    campaign_id: campaign.id,
    access_token: input.config.accessToken
  });
  const creative = await postMetaObject(`${graphBaseUrl}/${input.config.adAccountId}/adcreatives`, {
    ...input.draft.creative,
    access_token: input.config.accessToken
  });
  const ad = await postMetaObject(`${graphBaseUrl}/${input.config.adAccountId}/ads`, {
    ...input.draft.ad,
    adset_id: adSet.id,
    creative: { creative_id: creative.id },
    access_token: input.config.accessToken
  });

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    creativeId: creative.id,
    adId: ad.id
  };
}

export function normalizeZipCodes(value: string) {
  return Array.from(new Set(value.match(/\b\d{5}\b/g) || []));
}

function normalizePlatforms(platforms: AdPlatform[]) {
  return Array.from(new Set(platforms.filter((platform) => platformSet.has(platform))));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function postMetaObject(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message || "Meta Ads Manager did not create the requested object.");
  }

  return { id: payload.id };
}

async function fetchMetaObject<T>(url: string) {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Meta Ads Manager connection could not be verified.");
  }

  return payload;
}
