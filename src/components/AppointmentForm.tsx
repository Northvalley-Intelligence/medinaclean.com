"use client";

import { useState } from "react";
import type { Locale } from "@/lib/content";
import { normalizeUsPhone } from "@/lib/phone";
import { validateServiceAreaMessage } from "@/lib/service-area";

const text = {
  en: {
    name: "Name",
    phone: "Phone",
    address: "Address",
    zip: "ZIP code",
    service: "Service type",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    time1: "Preferred time 1",
    time2: "Preferred time 2",
    time3: "Preferred time 3",
    notes: "Notes",
    submit: "Send request",
    sending: "Sending...",
    success: "Request received. Rosa will review and contact you.",
    error: "The request could not be sent. Please check the fields and try again.",
    serviceOptions: ["First-time / one-time deep cleaning", "Every 3 weeks", "Every 2 weeks", "Small business cleaning"]
  },
  es: {
    name: "Nombre",
    phone: "Teléfono",
    address: "Dirección",
    zip: "Código ZIP",
    service: "Tipo de servicio",
    bedrooms: "Habitaciones",
    bathrooms: "Baños",
    time1: "Horario preferido 1",
    time2: "Horario preferido 2",
    time3: "Horario preferido 3",
    notes: "Notas",
    submit: "Enviar solicitud",
    sending: "Enviando...",
    success: "Solicitud recibida. Rosa la revisará y se comunicará con usted.",
    error: "No se pudo enviar la solicitud. Revise los campos e intente de nuevo.",
    serviceOptions: ["Primera / limpieza profunda de una vez", "Cada 3 semanas", "Cada 2 semanas", "Limpieza para pequeño negocio"]
  }
};

export function AppointmentForm({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [zipStatus, setZipStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [phoneStatus, setPhoneStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });

  function onZipBlur(event: React.FocusEvent<HTMLInputElement>) {
    const zip = event.currentTarget.value.trim();

    if (!zip) {
      setZipStatus({ type: "idle", message: "" });
      return;
    }

    if (!/^\d{5}$/.test(zip)) {
      setZipStatus({
        type: "error",
        message: locale === "es" ? "Ingrese un código ZIP de 5 dígitos." : "Enter a 5-digit ZIP code."
      });
      return;
    }

    const result = validateServiceAreaMessage(zip, locale);
    setZipStatus({ type: result.ok ? "success" : "error", message: result.message });
  }

  function onPhoneBlur(event: React.FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const normalized = normalizeUsPhone(input.value);

    if (!input.value.trim()) {
      setPhoneStatus({ type: "idle", message: "" });
      return;
    }

    if (!normalized) {
      setPhoneStatus({
        type: "error",
        message:
          locale === "es"
            ? "Ingrese un número de teléfono de EE. UU. de 10 dígitos."
            : "Enter a 10-digit US phone number."
      });
      return;
    }

    input.value = normalized.display;
    setPhoneStatus({
      type: "success",
      message: locale === "es" ? "Número válido de EE. UU." : "Valid US phone number."
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const phone = normalizeUsPhone(String(payload.phone || ""));

    if (!phone) {
      setPhoneStatus({
        type: "error",
        message:
          locale === "es"
            ? "Ingrese un número de teléfono de EE. UU. de 10 dígitos."
            : "Enter a 10-digit US phone number."
      });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, phone: phone.e164, language: locale })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || t.error);
      }

      form.reset();
      setStatus({ type: "success", message: t.success });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : t.error });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field-grid">
        <label>
          {t.name}
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          {t.phone}
          <input
            name="phone"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(470) 443-4817"
            onBlur={onPhoneBlur}
            aria-describedby="phone-status"
          />
          <span
            className={`field-hint ${phoneStatus.type === "error" ? "error" : phoneStatus.type === "success" ? "success" : ""}`}
            id="phone-status"
          >
            {phoneStatus.message}
          </span>
        </label>
      </div>
      <label>
        {t.address}
        <input name="address" required autoComplete="street-address" placeholder="Street, city, GA" />
      </label>
      <div className="field-grid">
        <label>
          {t.zip}
          <input
            name="zipCode"
            required
            inputMode="numeric"
            pattern="[0-9]{5}"
            placeholder="30188"
            onBlur={onZipBlur}
            aria-describedby="zip-status"
          />
          <span
            className={`field-hint ${zipStatus.type === "error" ? "error" : zipStatus.type === "success" ? "success" : ""}`}
            id="zip-status"
          >
            {zipStatus.message}
          </span>
        </label>
        <label>
          {t.service}
          <select name="serviceType" required defaultValue="">
            <option value="" disabled />
            {t.serviceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-grid">
        <label>
          {t.bedrooms}
          <select name="bedrooms" required defaultValue="3">
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.bathrooms}
          <input name="bathrooms" required type="number" min="1" max="6" step="0.5" defaultValue="2" />
        </label>
      </div>
      <div className="field-grid">
        <label>
          {t.time1}
          <input name="preferredTime1" required type="datetime-local" />
        </label>
        <label>
          {t.time2}
          <input name="preferredTime2" required type="datetime-local" />
        </label>
      </div>
      <label>
        {t.time3}
        <input name="preferredTime3" required type="datetime-local" />
      </label>
      <label>
        {t.notes}
        <textarea name="notes" />
      </label>
      <button className="button primary" type="submit" disabled={submitting}>
        {submitting ? t.sending : t.submit}
      </button>
      <p className={`status ${status.type === "error" ? "error" : status.type === "success" ? "success" : ""}`}>
        {status.message}
      </p>
    </form>
  );
}
