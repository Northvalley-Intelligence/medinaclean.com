import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import {
  buildAdPlan,
  buildMetaAdDraft,
  getMetaAdsConfig,
  inspectMetaAdsReadiness,
  publishPausedMetaAdDraft,
  type AdPlatform
} from "../../../../lib/ad-campaigns";
import { getAdminLocale } from "../../../../lib/admin-i18n";

type AdRequestBody = {
  lang?: string;
  campaignName?: string;
  dailyBudgetUsd?: string;
  zipCodes?: string;
  platforms?: AdPlatform[];
  publishMode?: "dry_run" | "publish_paused";
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = getMetaAdsConfig();
  if (!config.ok) {
    return NextResponse.json({
      ok: true,
      liveConfigured: false,
      missingConfig: config.missing
    });
  }

  try {
    const readiness = await inspectMetaAdsReadiness(config.config);
    return NextResponse.json({
      ok: true,
      liveConfigured: true,
      ...readiness
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        liveConfigured: true,
        errors: [error instanceof Error ? error.message : "Meta Ads Manager connection could not be verified."]
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: AdRequestBody;
  try {
    body = (await request.json()) as AdRequestBody;
  } catch {
    return NextResponse.json({ ok: false, errors: ["The ad request could not be read."] }, { status: 400 });
  }

  const plan = buildAdPlan({
    campaignName: String(body.campaignName || ""),
    dailyBudgetUsd: String(body.dailyBudgetUsd || ""),
    zipCodes: String(body.zipCodes || ""),
    platforms: Array.isArray(body.platforms) ? body.platforms : []
  });

  if (!plan.ok) {
    return NextResponse.json({ ok: false, errors: plan.errors }, { status: 400 });
  }

  const config = getMetaAdsConfig();
  const draft = buildMetaAdDraft({
    plan: plan.plan,
    locale: getAdminLocale(body.lang),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://medinaclean.com",
    config: config.ok ? config.config : undefined
  });
  const publishMode = body.publishMode === "publish_paused" ? "publish_paused" : "dry_run";

  if (publishMode !== "publish_paused" || !config.ok) {
    return NextResponse.json({
      ok: true,
      mode: "dry_run",
      liveConfigured: config.ok,
      missingConfig: config.ok ? [] : config.missing,
      draft
    });
  }

  try {
    const meta = await publishPausedMetaAdDraft({ draft, config: config.config });
    return NextResponse.json({
      ok: true,
      mode: "publish_paused",
      liveConfigured: true,
      draft,
      meta
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, errors: [error instanceof Error ? error.message : "Meta Ads Manager could not create the ad."] },
      { status: 502 }
    );
  }
}
