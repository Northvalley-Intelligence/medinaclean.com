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
