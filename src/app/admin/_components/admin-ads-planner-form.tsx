"use client";

import { useEffect, useMemo, useState } from "react";
import { adminText, type AdminLocale } from "@/lib/admin-i18n";
import { buildAdChatLandingUrl, buildAdPlan, defaultAdZipCodes, type AdPlatform } from "@/lib/ad-campaigns";

type AdBackendResult =
  | {
      ok: true;
      mode: "dry_run" | "publish_paused";
      liveConfigured: boolean;
      missingConfig?: string[];
      draft: {
        landingUrl: string;
        campaign: { name?: string; objective?: string; status?: string };
        adSet: { daily_budget?: number; status?: string };
        ad?: { status?: string };
      };
      meta?: {
        campaignId: string;
        adSetId: string;
        creativeId: string;
        adId: string;
      };
    }
  | { ok: false; errors: string[] };

type AdConnectionStatus =
  | {
      ok: true;
      liveConfigured: false;
      missingConfig: string[];
    }
  | {
      ok: true;
      liveConfigured: true;
      account: { id: string; name: string; status: string; currency: string };
      page: { id: string; name: string };
      instagram?: { id: string; username?: string };
    }
  | { ok: false; errors: string[] };

export function AdminAdsPlannerForm({ locale }: { locale: AdminLocale }) {
  const t = adminText[locale];
  const [campaignName, setCampaignName] = useState<string>(t.recommendedCampaign);
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("20");
  const [zipCodes, setZipCodes] = useState(defaultAdZipCodes.join("\n"));
  const [platforms, setPlatforms] = useState<AdPlatform[]>(["instagram", "facebook"]);
  const [ready, setReady] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<"" | "dry_run" | "publish_paused">("");
  const [backendResult, setBackendResult] = useState<AdBackendResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<AdConnectionStatus | null>(null);

  useEffect(() => {
    window.setTimeout(() => setReady(true), 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadConnectionStatus() {
      try {
        const response = await fetch("/api/admin/ads");
        const result = (await response.json()) as AdConnectionStatus;
        if (!cancelled) {
          setConnectionStatus(result);
        }
      } catch {
        if (!cancelled) {
          setConnectionStatus({ ok: false, errors: [t.metaConnectionError] });
        }
      }
    }

    void loadConnectionStatus();
    return () => {
      cancelled = true;
    };
  }, [t.metaConnectionError]);

  const plan = useMemo(
    () => buildAdPlan({ campaignName, dailyBudgetUsd, zipCodes, platforms }),
    [campaignName, dailyBudgetUsd, zipCodes, platforms]
  );
  const normalizedPlan = plan.ok
    ? plan.plan
    : {
        campaignName: campaignName.trim() || t.recommendedCampaign,
        dailyBudgetUsd: Number(dailyBudgetUsd) || 20,
        zipCodes: defaultAdZipCodes.slice(),
        platforms
      };
  const landingUrl = buildAdChatLandingUrl({
    baseUrl: "https://medinaclean.com",
    locale,
    campaignName: normalizedPlan.campaignName,
    zipCodes: normalizedPlan.zipCodes,
    platforms: normalizedPlan.platforms
  });

  function togglePlatform(platform: AdPlatform) {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    );
  }

  async function submitBackend(publishMode: "dry_run" | "publish_paused") {
    setSubmittingMode(publishMode);
    setBackendResult(null);
    try {
      const response = await fetch("/api/admin/ads", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          lang: locale,
          campaignName,
          dailyBudgetUsd,
          zipCodes,
          platforms,
          publishMode
        })
      });
      const result = (await response.json()) as AdBackendResult;
      setBackendResult(result);
    } catch {
      setBackendResult({ ok: false, errors: [t.adBackendError] });
    } finally {
      setSubmittingMode("");
    }
  }

  return (
    <form id="admin-ads-planner-form" className="admin-form" action="/admin/ads" method="get" data-ready={ready}>
      <input name="lang" type="hidden" value={locale} />
      <div className="admin-result-box compact" aria-live="polite">
        {!connectionStatus ? (
          <p>{t.metaConnectionLoading}</p>
        ) : connectionStatus.ok && connectionStatus.liveConfigured ? (
          <>
            <strong>
              {t.metaConnectionReady} {connectionStatus.account.name} / {connectionStatus.page.name}
            </strong>
            <p>
              {connectionStatus.account.currency} · {connectionStatus.account.status}
            </p>
            {connectionStatus.instagram ? (
              <p>
                {t.metaInstagramAccount} {connectionStatus.instagram.username || connectionStatus.instagram.id}
              </p>
            ) : null}
          </>
        ) : connectionStatus.ok ? (
          <>
            <strong>{t.metaConnectionMissing}</strong>
            <p>
              {t.adBackendMissingConfig} {connectionStatus.missingConfig.join(", ")}
            </p>
          </>
        ) : (
          connectionStatus.errors.map((error) => <p key={error}>{error}</p>)
        )}
      </div>
      <label>
        {t.campaignName}
        <input
          name="campaignName"
          value={campaignName}
          disabled={!ready}
          onChange={(event) => setCampaignName(event.target.value)}
        />
      </label>
      <label>
        {t.dailyBudget}
        <input
          name="dailyBudgetUsd"
          type="number"
          min="5"
          max="250"
          step="1"
          value={dailyBudgetUsd}
          disabled={!ready}
          onChange={(event) => setDailyBudgetUsd(event.target.value)}
        />
      </label>
      <label>
        {t.adZipCodes}
        <textarea name="zipCodes" value={zipCodes} disabled={!ready} onChange={(event) => setZipCodes(event.target.value)} />
      </label>
      <fieldset className="admin-checks">
        <legend>{t.adPlatforms}</legend>
        <label>
          <input
            name="platforms"
            type="checkbox"
            value="instagram"
            checked={platforms.includes("instagram")}
            disabled={!ready}
            onChange={() => togglePlatform("instagram")}
          />
          {t.instagram}
        </label>
        <label>
          <input
            name="platforms"
            type="checkbox"
            value="facebook"
            checked={platforms.includes("facebook")}
            disabled={!ready}
            onChange={() => togglePlatform("facebook")}
          />
          {t.facebook}
        </label>
      </fieldset>
      {!plan.ok ? (
        <div className="admin-alert inline" aria-live="polite">
          {plan.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
      <div className="admin-result-box">
        <span>{t.adLandingLink}</span>
        <a href={landingUrl}>{landingUrl}</a>
        <p>{t.adLandingHint}</p>
        <a className="button primary" href={landingUrl} target="_blank" rel="noreferrer">
          {t.openChatLink}
        </a>
      </div>
      <div className="admin-actions">
        <button
          className="button secondary"
          type="button"
          disabled={!ready || submittingMode !== ""}
          onClick={() => void submitBackend("dry_run")}
        >
          {submittingMode === "dry_run" ? "..." : t.prepareAdDraft}
        </button>
        <button
          className="button primary"
          type="button"
          disabled={!ready || submittingMode !== ""}
          onClick={() => void submitBackend("publish_paused")}
        >
          {submittingMode === "publish_paused" ? "..." : t.publishPausedAd}
        </button>
      </div>
      {backendResult ? (
        <div className={backendResult.ok ? "admin-result-box" : "admin-alert inline"} aria-live="polite">
          {backendResult.ok ? (
            <>
              <strong>
                {backendResult.mode === "publish_paused" && backendResult.meta
                  ? t.adBackendPublished
                  : t.adBackendDryRunReady}
              </strong>
              <p>{backendResult.liveConfigured ? t.adBackendConfigured : t.adBackendNotConfigured}</p>
              {backendResult.missingConfig && backendResult.missingConfig.length > 0 ? (
                <p>
                  {t.adBackendMissingConfig} {backendResult.missingConfig.join(", ")}
                </p>
              ) : null}
              <details>
                <summary>{t.adDraftDetails}</summary>
                <dl className="admin-result-list">
                  <div>
                    <dt>{t.campaignName}</dt>
                    <dd>{backendResult.draft.campaign.name}</dd>
                  </div>
                  <div>
                    <dt>{t.dailyBudget}</dt>
                    <dd>${((backendResult.draft.adSet.daily_budget || 0) / 100).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt>{t.adLandingLink}</dt>
                    <dd>
                      <a href={backendResult.draft.landingUrl}>{backendResult.draft.landingUrl}</a>
                    </dd>
                  </div>
                </dl>
              </details>
            </>
          ) : (
            backendResult.errors.map((error) => <p key={error}>{error}</p>)
          )}
        </div>
      ) : null}
    </form>
  );
}
