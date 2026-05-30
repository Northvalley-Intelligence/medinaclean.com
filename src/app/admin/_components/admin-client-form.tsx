"use client";

import { useEffect, useState } from "react";
import type { AdminLocale } from "@/lib/admin-i18n";
import { adminText } from "@/lib/admin-i18n";
import { normalizeUsPhone } from "@/lib/phone";

export function AdminClientForm({ locale }: { locale: AdminLocale }) {
  const t = adminText[locale];
  const [ready, setReady] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  function validatePhone(input: HTMLInputElement) {
    const normalized = normalizeUsPhone(input.value);

    if (!input.value.trim()) {
      setPhoneStatus({ type: "idle", message: "" });
      input.setCustomValidity("");
      return false;
    }

    if (!normalized) {
      const message =
        locale === "es"
          ? "Ingrese un número de teléfono de EE. UU. de 10 dígitos."
          : "Enter a 10-digit US phone number.";
      setPhoneStatus({ type: "error", message });
      input.setCustomValidity(message);
      return false;
    }

    input.value = normalized.display;
    input.setCustomValidity("");
    setPhoneStatus({
      type: "success",
      message: locale === "es" ? "Número válido de EE. UU." : "Valid US phone number."
    });
    return true;
  }

  function onPhoneBlur(event: React.FocusEvent<HTMLInputElement>) {
    validatePhone(event.currentTarget);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const phone = form.elements.namedItem("phone");
    if (phone instanceof HTMLInputElement && !validatePhone(phone)) {
      event.preventDefault();
      phone.reportValidity();
    }
  }

  return (
    <form
      className="admin-panel admin-form"
      action="/api/admin/clients"
      method="post"
      onSubmit={onSubmit}
      data-ready={ready ? "true" : "false"}
    >
      <input name="lang" type="hidden" value={locale} />
      <h2>{t.addClient}</h2>
      <label>
        {t.name}
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        {t.phone}
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="(470) 443-4817"
          onBlur={onPhoneBlur}
          aria-describedby="admin-client-phone-status"
        />
        <span
          className={`field-hint ${phoneStatus.type === "error" ? "error" : phoneStatus.type === "success" ? "success" : ""}`}
          id="admin-client-phone-status"
        >
          {phoneStatus.message}
        </span>
      </label>
      <div className="admin-form-row">
        <label>
          {t.email}
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          {t.preferredChannel}
          <select name="preferredCommunicationChannel" defaultValue="email">
            <option value="email">{t.channelEmail}</option>
            <option value="phone">{t.channelPhone}</option>
            <option value="sms">{t.channelSms}</option>
            <option value="whatsapp">{t.channelWhatsapp}</option>
          </select>
        </label>
      </div>
      <label>
        {t.address}
        <input name="address" autoComplete="street-address" />
      </label>
      <div className="admin-form-row">
        <label>
          {t.zip}
          <input name="zipCode" inputMode="numeric" pattern="[0-9]{5}" />
        </label>
        <label>
          {t.language}
          <select name="preferredLanguage" defaultValue="en">
            <option value="en">{t.englishLanguage}</option>
            <option value="es">{t.spanishLanguage}</option>
          </select>
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          {t.frequency}
          <select name="cleaningFrequency" defaultValue="every_2_weeks">
            <option value="weekly">{t.weekly}</option>
            <option value="every_2_weeks">{t.every2Weeks}</option>
            <option value="every_3_weeks">{t.every3Weeks}</option>
            <option value="monthly">{t.monthly}</option>
            <option value="one_time">{t.oneTime}</option>
            <option value="custom">{t.custom}</option>
            <option value="unknown">{t.unknown}</option>
          </select>
        </label>
        <label>
          {t.price}
          <input name="currentPriceUsd" inputMode="decimal" placeholder="150" />
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          {t.usualDay}
          <input name="usualDay" placeholder="Tuesday" />
        </label>
        <label>
          {t.usualTime}
          <input name="usualTime" placeholder="Morning" />
        </label>
      </div>
      <div className="admin-checks">
        <label>
          <input name="canAskForReview" type="checkbox" /> {t.canAskReview}
        </label>
        <label>
          <input name="canAskForReferral" type="checkbox" /> {t.canAskReferral}
        </label>
      </div>
      <label>
        {t.notes}
        <textarea name="notes" rows={4} placeholder="Pets, access, supplies, preferences" />
      </label>
      <button className="button primary" type="submit">
        {t.saveClient}
      </button>
    </form>
  );
}
