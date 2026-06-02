"use client";

import { useEffect, useMemo, useState } from "react";
import { adminText, type AdminLocale } from "@/lib/admin-i18n";
import { buildAdChatLandingUrl, buildAdPlan, defaultAdZipCodes, type AdPlatform } from "@/lib/ad-campaigns";

export function AdminAdsPlannerForm({ locale }: { locale: AdminLocale }) {
  const t = adminText[locale];
  const [campaignName, setCampaignName] = useState<string>(t.recommendedCampaign);
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("20");
  const [zipCodes, setZipCodes] = useState(defaultAdZipCodes.join("\n"));
  const [platforms, setPlatforms] = useState<AdPlatform[]>(["instagram", "facebook"]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.setTimeout(() => setReady(true), 0);
  }, []);

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

  return (
    <form id="admin-ads-planner-form" className="admin-form" action="/admin/ads" method="get" data-ready={ready}>
      <input name="lang" type="hidden" value={locale} />
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
    </form>
  );
}
