"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { AdminLocale } from "@/lib/admin-i18n";
import { adminText } from "@/lib/admin-i18n";

export function AdminVideoUploadForm({ locale }: { locale: AdminLocale }) {
  const t = adminText[locale];
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  async function submitVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        credentials: "same-origin"
      });

      window.location.href = response.url || `/admin/videos${locale === "en" ? "?lang=en" : ""}`;
    } catch {
      const params = new URLSearchParams();
      if (locale === "en") {
        params.set("lang", "en");
      }
      params.set("error", "The video could not be uploaded.");
      window.location.href = `/admin/videos?${params.toString()}`;
    }
  }

  return (
    <>
      <form
        id="admin-video-upload-form"
        className="video-upload-form"
        action="/api/admin/videos"
        method="post"
        encType="multipart/form-data"
        onSubmit={submitVideo}
        data-ready={ready ? "true" : "false"}
      >
        <div className="admin-form">
          <input name="lang" type="hidden" value={locale} />
          <label>
            {t.titleEs}
            <input name="titleEs" maxLength={120} placeholder="Video de Medina Clean" />
          </label>
          <label>
            {t.titleEn}
            <input name="titleEn" maxLength={120} placeholder="Before and after kitchen" />
          </label>
          <label>
            {t.videoDescription}
            <input name="description" maxLength={1000} />
          </label>
          <label>
            {t.videoServiceFocus}
            <select name="serviceFocus" defaultValue="">
              <option value="">{t.videoServiceFocusNone}</option>
              <option value="kitchen_cleaning">{t.videoServiceFocusKitchen}</option>
              <option value="bathroom_cleaning">{t.videoServiceFocusBathroom}</option>
              <option value="deep_cleaning">{t.videoServiceFocusDeep}</option>
              <option value="recurring_cleaning">{t.videoServiceFocusRecurring}</option>
              <option value="post_construction_cleaning">{t.videoServiceFocusPostConstruction}</option>
              <option value="small_business_cleaning">{t.videoServiceFocusSmallBusiness}</option>
              <option value="house_cleaning">{t.videoServiceFocusHouse}</option>
              <option value="apartment_condo_cleaning">{t.videoServiceFocusApartmentCondo}</option>
            </select>
          </label>
          <label>
            {t.privacy}
            <select name="privacyStatus" defaultValue="public">
              <option value="public">{t.privacyPublic}</option>
              <option value="unlisted">{t.privacyUnlisted}</option>
              <option value="private">{t.privacyPrivate}</option>
            </select>
          </label>
          <label>
            {t.videoFile}
            <input name="video" type="file" accept="video/mp4,video/quicktime,video/webm" required />
          </label>
          <p className="admin-field-note">{t.videoUploadLimit}</p>
          <p className="admin-field-note">{t.videoShortsDefault}</p>
        </div>
      </form>
      <button
        className="button primary admin-submit-button"
        type="submit"
        form="admin-video-upload-form"
        disabled={!ready || uploading}
      >
        {uploading ? t.uploadToYouTubePending : t.uploadToYouTube}
      </button>
      <p className="admin-field-note admin-upload-status" aria-live="polite">
        {uploading ? t.videoUploadPendingNote : ""}
      </p>
    </>
  );
}
