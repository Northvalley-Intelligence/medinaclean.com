"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/content";
import {
  buildChatAppointmentNotes,
  calculateCleaningEstimate,
  chatServiceType,
  negotiateCleaningEstimate,
  type ChatFrequency,
  type CleaningAddOnInput,
  type CleaningEstimate
} from "@/lib/chat-agent";
import { buildEstimatePdfLines, createEstimatePdf, type PdfLogoImage } from "@/lib/estimate-pdf";
import { normalizeUsPhone } from "@/lib/phone";
import { validateServiceArea } from "@/lib/service-area";

const chatTurnStorageKey = "medina-clean-chat-turn-index";

const copy = {
  en: {
    title: "Chat estimate",
    intro: "Rosa's assistant can check the ZIP, estimate a starting price, and collect times for Rosa to review.",
    aiTitle: "Ask a question",
    aiIntro: "Use English or Spanish. For booking details, continue to the guided form below.",
    aiPlaceholder: "Example: I have 3 bedrooms, 2 bathrooms, and want cleaning every 2 weeks in 30188.",
    aiSend: "Ask",
    aiSending: "Thinking...",
    aiError: "The assistant could not respond. Use the guided estimate below.",
    aiEstimateAction: "Check ZIP and enter contact details",
    you: "You",
    assistant: "Assistant",
    guidedTitle: "Guided form",
    zip: "ZIP code",
    checkZip: "Check ZIP",
    zipGood: "Great, that ZIP is in Rosa's current service area.",
    zipBad: "That ZIP appears outside Rosa's automatic service area. Rosa can still review it manually.",
    frequency: "Cleaning frequency",
    frequencyOptions: [
      ["every_2_weeks", "Every 2 weeks"],
      ["every_3_weeks", "Every 3 weeks"],
      ["one_time", "First-time / one-time"],
      ["post_construction", "Post-construction cleanup"]
    ],
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    bathroomsError: "Enter 1 to 6 bathrooms.",
    addOns: "Add-ons",
    ovenAndFridge: "Oven and refrigerator",
    standard: "$50 standard",
    veryDirty: "$80 if very dirty",
    getEstimate: "Get estimate",
    firstEstimate: "First cleaning rough estimate:",
    recurringEstimate: "Recurring estimate:",
    oneTimeEstimate: "One-time rough estimate:",
    onsiteEstimate: "Post-construction cleanup is estimated after Rosa sees the property onsite.",
    every2: "every 2 weeks",
    every3: "every 3 weeks",
    disclaimer: "This is a rough estimate. Rosa confirms the actual amount after seeing the property.",
    interested: "Interested in having Rosa review the calendar?",
    high: "Price feels high",
    reasonableAmount: "Reasonable recurring amount",
    readyEveryTwo: "I am ready for every-two-week cleaning",
    reviewAmount: "Review amount",
    adjusted: "Rosa can honor $AMOUNT every 2 weeks as a rough recurring estimate.",
    cannotAdjust:
      "Rosa can only auto-adjust up to $50 when the client is ready for every-two-week service. She can still review your request.",
    name: "Name",
    phone: "Phone",
    address: "Street address",
    time1: "Preferred time 1",
    time2: "Preferred time 2",
    time3: "Preferred time 3",
    pdfReady: "Estimate PDF is ready.",
    pdfDownload: "Download estimate PDF",
    notes: "Anything Rosa should know?",
    send: "Send to Rosa",
    sending: "Sending...",
    success: "Thanks. Rosa will review the calendar and contact you to confirm.",
    error: "The request could not be sent. Please check the details and try again.",
    phoneError: "Enter a 10-digit US phone number.",
    phoneValid: "Valid US phone number.",
    addressError: "Enter the street address.",
    quickTitle: "Quick answers",
    materialsQuestion: "Cleaning materials",
    materialsAnswer:
      "Starting rates assume Rosa brings standard cleaning materials. Special product requests may change the price.",
    serviceAreaQuestion: "Service area",
    serviceAreaAnswer: "The site checks ZIP codes within about 20 miles of 30188, then Rosa confirms the exact address.",
    privacyQuestion: "Privacy",
    privacyAnswer: "Appointment requests and pending reviews stay private. Public reviews appear only after approval and consent."
  },
  es: {
    title: "Estimado por chat",
    intro: "El asistente de Rosa puede revisar el ZIP, calcular un precio inicial y pedir horarios para que Rosa revise.",
    aiTitle: "Haga una pregunta",
    aiIntro: "Use español o inglés. Para enviar datos de cita, continúe al formulario guiado abajo.",
    aiPlaceholder: "Ejemplo: Tengo 3 habitaciones, 2 baños y quiero limpieza cada 2 semanas en 30188.",
    aiSend: "Preguntar",
    aiSending: "Pensando...",
    aiError: "El asistente no pudo responder. Use el estimado guiado abajo.",
    aiEstimateAction: "Revisar ZIP e ingresar datos de contacto",
    you: "Usted",
    assistant: "Asistente",
    guidedTitle: "Formulario guiado",
    zip: "Código ZIP",
    checkZip: "Revisar ZIP",
    zipGood: "Muy bien, ese ZIP está dentro del área de servicio actual de Rosa.",
    zipBad: "Ese ZIP parece estar fuera del área automática. Rosa puede revisarlo manualmente.",
    frequency: "Frecuencia de limpieza",
    frequencyOptions: [
      ["every_2_weeks", "Cada 2 semanas"],
      ["every_3_weeks", "Cada 3 semanas"],
      ["one_time", "Primera / una vez"],
      ["post_construction", "Limpieza después de construcción"]
    ],
    bedrooms: "Habitaciones",
    bathrooms: "Baños",
    bathroomsError: "Ingrese de 1 a 6 baños.",
    addOns: "Extras",
    ovenAndFridge: "Horno y refrigerador",
    standard: "$50 normal",
    veryDirty: "$80 si está muy sucio",
    getEstimate: "Calcular estimado",
    firstEstimate: "Estimado inicial de primera limpieza:",
    recurringEstimate: "Estimado recurrente:",
    oneTimeEstimate: "Estimado de una vez:",
    onsiteEstimate: "La limpieza después de construcción se estima después de que Rosa vea la propiedad.",
    every2: "cada 2 semanas",
    every3: "cada 3 semanas",
    disclaimer: "Este es un estimado. Rosa confirma el monto real después de ver la propiedad.",
    interested: "¿Le interesa que Rosa revise el calendario?",
    high: "El precio está alto",
    reasonableAmount: "Monto recurrente razonable",
    readyEveryTwo: "Estoy listo para limpieza cada dos semanas",
    reviewAmount: "Revisar monto",
    adjusted: "Rosa puede aceptar $AMOUNT cada 2 semanas como estimado recurrente.",
    cannotAdjust:
      "Rosa solo puede ajustar automáticamente hasta $50 si el cliente está listo para servicio cada dos semanas. Igual puede revisar su solicitud.",
    name: "Nombre",
    phone: "Teléfono",
    address: "Dirección",
    time1: "Horario preferido 1",
    time2: "Horario preferido 2",
    time3: "Horario preferido 3",
    pdfReady: "El PDF del estimado está listo.",
    pdfDownload: "Descargar PDF del estimado",
    notes: "¿Algo que Rosa debe saber?",
    send: "Enviar a Rosa",
    sending: "Enviando...",
    success: "Gracias. Rosa revisará el calendario y se comunicará para confirmar.",
    error: "No se pudo enviar la solicitud. Revise los datos e intente de nuevo.",
    phoneError: "Ingrese un número de teléfono de EE. UU. de 10 dígitos.",
    phoneValid: "Número válido de EE. UU.",
    addressError: "Ingrese la dirección.",
    quickTitle: "Respuestas rápidas",
    materialsQuestion: "Materiales de limpieza",
    materialsAnswer:
      "Los precios iniciales asumen que Rosa trae materiales estándar. Productos especiales pueden cambiar el precio.",
    serviceAreaQuestion: "Área de servicio",
    serviceAreaAnswer: "El sitio revisa ZIPs dentro de aproximadamente 20 millas de 30188; Rosa confirma la dirección exacta.",
    privacyQuestion: "Privacidad",
    privacyAnswer:
      "Las solicitudes de cita y reseñas pendientes son privadas. Las reseñas públicas aparecen solo con aprobación y permiso."
  }
} satisfies Record<Locale, Record<string, string | string[][]>>;

export function ChatEstimateAgent({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [zipCode, setZipCode] = useState("30188");
  const [zipOk, setZipOk] = useState(false);
  const [zipMessage, setZipMessage] = useState("");
  const [frequency, setFrequency] = useState<ChatFrequency>("every_2_weeks");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [ovenFridgeCondition, setOvenFridgeCondition] = useState<"" | "standard" | "very_dirty">("");
  const [estimate, setEstimate] = useState<CleaningEstimate | null>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string; mode?: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [readyEveryTwo, setReadyEveryTwo] = useState(false);
  const [adjustedRecurringEstimateUsd, setAdjustedRecurringEstimateUsd] = useState<number | null>(null);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [addressStatus, setAddressStatus] = useState<{ type: "idle" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [bathroomsStatus, setBathroomsStatus] = useState<{ type: "idle" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  function checkZip() {
    const result = validateServiceArea(zipCode.trim());
    setZipOk(result.ok);
    setZipMessage(result.ok ? String(t.zipGood) : String(t.zipBad));
    if (!result.ok) {
      setEstimate(null);
    }
  }

  function buildEstimate() {
    if (!validateBathrooms()) {
      setEstimate(null);
      return;
    }

    const addOns: CleaningAddOnInput[] = [];
    if (ovenFridgeCondition) {
      addOns.push({ type: "oven_and_fridge", condition: ovenFridgeCondition });
    }

    const nextEstimate = calculateCleaningEstimate({
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      frequency,
      addOns
    });
    setEstimate(nextEstimate);
    setAdjustedRecurringEstimateUsd(null);
    setNegotiationMessage("");
  }

  function reviewRequestedAmount() {
    if (!estimate) {
      return;
    }

    const result = negotiateCleaningEstimate(estimate, Number(requestedAmount), readyEveryTwo);
    if (result.accepted) {
      setAdjustedRecurringEstimateUsd(result.adjustedRecurringEstimateUsd);
      setNegotiationMessage(String(t.adjusted).replace("$AMOUNT", `$${result.adjustedRecurringEstimateUsd}`));
      return;
    }

    setAdjustedRecurringEstimateUsd(null);
    setNegotiationMessage(String(t.cannotAdjust));
  }

  function onPhoneBlur(event: React.FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const normalized = normalizeUsPhone(input.value);

    if (!input.value.trim()) {
      setPhoneStatus({ type: "idle", message: "" });
      return;
    }

    if (!normalized) {
      setPhoneStatus({ type: "error", message: String(t.phoneError) });
      return;
    }

    input.value = normalized.display;
    setPhoneStatus({ type: "success", message: String(t.phoneValid) });
  }

  function onPhoneChange() {
    if (phoneStatus.type !== "idle") {
      setPhoneStatus({ type: "idle", message: "" });
    }
  }

  function onAddressBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (!event.currentTarget.value.trim()) {
      setAddressStatus({ type: "error", message: String(t.addressError) });
      return;
    }

    setAddressStatus({ type: "idle", message: "" });
  }

  function onAddressChange() {
    if (addressStatus.type !== "idle") {
      setAddressStatus({ type: "idle", message: "" });
    }
  }

  function validateBathrooms() {
    const value = Number(bathrooms);
    if (!Number.isFinite(value) || value < 1 || value > 6) {
      setBathroomsStatus({ type: "error", message: String(t.bathroomsError) });
      return false;
    }

    setBathroomsStatus({ type: "idle", message: "" });
    return true;
  }

  function onBathroomsChange(value: string) {
    setBathrooms(value);
    if (bathroomsStatus.type !== "idle") {
      setBathroomsStatus({ type: "idle", message: "" });
    }
  }

  async function submitAiChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = aiInput.trim();
    if (!message || aiSubmitting) {
      return;
    }

    setAiInput("");
    setAiSubmitting(true);
    setAiMessages((messages) => [...messages, { role: "user", content: message }]);
    const turnIndex = getChatTurnIndex();
    setChatTurnIndex(turnIndex + 1);

    try {
      const response = await fetch("/api/chat-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, message, turnIndex })
      });
      const result = (await response.json().catch(() => ({}))) as { reply?: string; mode?: string; error?: string };
      if (!response.ok || !result.reply) {
        throw new Error(result.error || String(t.aiError));
      }

      setAiMessages((messages) => [
        ...messages,
        { role: "assistant", content: result.reply || String(t.aiError), mode: result.mode }
      ]);
    } catch {
      setAiMessages((messages) => [...messages, { role: "assistant", content: String(t.aiError), mode: "error" }]);
    } finally {
      setAiSubmitting(false);
    }
  }

  function onAiInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimate) {
      return;
    }
    if (!validateBathrooms()) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const phone = normalizeUsPhone(String(formData.get("phone") || ""));
    if (!phone) {
      setPhoneStatus({ type: "error", message: String(t.phoneError) });
      setStatus({ type: "idle", message: "" });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const notes = buildChatAppointmentNotes({
      estimate,
      adjustedRecurringEstimateUsd,
      extraNotes: String(formData.get("notes") || "")
    });

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: locale,
          name: formData.get("name"),
          phone: phone.e164,
          address: formData.get("address"),
          zipCode,
          serviceType: chatServiceType(frequency),
          bedrooms,
          bathrooms,
          preferredTime1: formData.get("preferredTime1"),
          preferredTime2: formData.get("preferredTime2"),
          preferredTime3: formData.get("preferredTime3"),
          notes,
          source: "chat_agent"
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || String(t.error));
      }

      const nextPdfUrl = await buildPdfDownloadUrl({
        estimate,
        adjustedRecurringEstimateUsd,
        locale,
        name: String(formData.get("name") || ""),
        phone: phone.display,
        address: String(formData.get("address") || ""),
        zipCode,
        bedrooms,
        bathrooms,
        frequency,
        preferredTimes: [
          String(formData.get("preferredTime1") || ""),
          String(formData.get("preferredTime2") || ""),
          String(formData.get("preferredTime3") || "")
        ],
        notes: String(formData.get("notes") || "")
      });
      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return nextPdfUrl;
      });
      form.reset();
      setStatus({ type: "success", message: String(t.success) });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : String(t.error) });
    } finally {
      setSubmitting(false);
    }
  }

  const frequencyLabel = frequency === "every_2_weeks" ? t.every2 : t.every3;

  return (
    <article className="card chat-card">
      <section className="ai-chat-panel" aria-label={String(t.aiTitle)}>
        <div className="ai-chat-head">
          <h4>{t.aiTitle}</h4>
          <p>{t.aiIntro}</p>
        </div>
        {aiMessages.length > 0 ? (
          <div className="ai-chat-thread" aria-live="polite">
            {aiMessages.map((message, index) => (
              <div className={`ai-chat-message ${message.role}`} key={`${message.role}-${index}`}>
                <strong>{message.role === "user" ? t.you : t.assistant}</strong>
                <p>{message.content}</p>
                {message.role === "assistant" && isEstimateReply(message.content) ? (
                  <a className="button secondary compact ai-chat-action" href="#guided-estimate">
                    {t.aiEstimateAction}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        <form className="ai-chat-form" onSubmit={submitAiChat}>
          <label>
            <span className="sr-only">{t.aiTitle}</span>
            <textarea
              onKeyDown={onAiInputKeyDown}
              onChange={(event) => setAiInput(event.target.value)}
              placeholder={aiMessages.length === 0 ? String(t.aiPlaceholder) : ""}
              rows={3}
              value={aiInput}
            />
          </label>
          <button className="button primary" disabled={aiSubmitting || !aiInput.trim()} type="submit">
            {aiSubmitting ? t.aiSending : t.aiSend}
          </button>
        </form>
      </section>

      <div className="chat-guided-label" id="guided-estimate">
        <h4>{t.guidedTitle}</h4>
      </div>

      <div className="chat-step">
        <label>
          {t.zip}
          <input
            value={zipCode}
            onChange={(event) => setZipCode(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]{5}"
            placeholder="30188"
          />
        </label>
        <button className="button secondary" type="button" onClick={checkZip}>
          {t.checkZip}
        </button>
      </div>
      {zipMessage ? <p className={`status ${zipOk ? "success" : "error"}`}>{zipMessage}</p> : null}

      {zipOk ? (
        <>
          <div className="field-grid">
            <label>
              {t.frequency}
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as ChatFrequency)}>
                {(t.frequencyOptions as string[][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.bedrooms}
              <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="chat-step">
            <label>
              {t.bathrooms}
              <input
                value={bathrooms}
                onChange={(event) => onBathroomsChange(event.target.value)}
                onBlur={validateBathrooms}
                type="number"
                min="1"
                max="6"
                step="0.5"
                aria-describedby="chat-bathrooms-status"
              />
              <span
                className={`field-hint ${bathroomsStatus.type === "error" ? "error" : ""}`}
                id="chat-bathrooms-status"
              >
                {bathroomsStatus.message}
              </span>
            </label>
            <button className="button primary" type="button" onClick={buildEstimate}>
              {t.getEstimate}
            </button>
          </div>
          <fieldset className="chat-addons">
            <legend>{t.addOns}</legend>
            <label>
              {t.ovenAndFridge}
              <select
                value={ovenFridgeCondition}
                onChange={(event) => setOvenFridgeCondition(event.target.value as typeof ovenFridgeCondition)}
              >
                <option value="" />
                <option value="standard">{t.standard}</option>
                <option value="very_dirty">{t.veryDirty}</option>
              </select>
            </label>
          </fieldset>
        </>
      ) : null}

      {estimate ? (
        <div className="chat-estimate" aria-live="polite">
          {estimate.recurringEstimateUsd ? (
            <>
              <p>
                {t.firstEstimate} <strong>${(adjustedRecurringEstimateUsd || estimate.recurringEstimateUsd) * 2}</strong>.
              </p>
              <p>
                {t.recurringEstimate} <strong>${adjustedRecurringEstimateUsd || estimate.recurringEstimateUsd}</strong>{" "}
                {frequencyLabel}.
              </p>
            </>
          ) : estimate.frequency === "post_construction" ? (
            <p>{t.onsiteEstimate}</p>
          ) : (
            <p>
              {t.oneTimeEstimate} <strong>${estimate.oneTimeEstimateUsd}</strong>.
            </p>
          )}
          <p>{t.disclaimer}</p>
          <p>{t.interested}</p>
          {estimate.frequency === "every_2_weeks" ? (
            <button className="button ghost" type="button" onClick={() => setShowNegotiation(true)}>
              {t.high}
            </button>
          ) : null}
        </div>
      ) : null}

      {showNegotiation && estimate?.frequency === "every_2_weeks" ? (
        <div className="chat-negotiation">
          <div className="field-grid">
            <label>
              {t.reasonableAmount}
              <input
                value={requestedAmount}
                onChange={(event) => setRequestedAmount(event.target.value)}
                type="number"
                min="1"
                step="1"
              />
            </label>
            <label className="checkbox">
              <input
                checked={readyEveryTwo}
                onChange={(event) => setReadyEveryTwo(event.target.checked)}
                type="checkbox"
              />
              {t.readyEveryTwo}
            </label>
          </div>
          <button className="button secondary" type="button" onClick={reviewRequestedAmount}>
            {t.reviewAmount}
          </button>
          {negotiationMessage ? <p className="status success">{negotiationMessage}</p> : null}
        </div>
      ) : null}

      {estimate ? (
        <form className="form" onSubmit={submitRequest}>
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
                onBlur={onPhoneBlur}
                onChange={onPhoneChange}
                aria-describedby="chat-phone-status"
              />
              <span
                className={`field-hint ${phoneStatus.type === "error" ? "error" : phoneStatus.type === "success" ? "success" : ""}`}
                id="chat-phone-status"
              >
                {phoneStatus.message}
              </span>
            </label>
          </div>
          <label>
            {t.address}
            <input
              name="address"
              required
              autoComplete="street-address"
              onBlur={onAddressBlur}
              onChange={onAddressChange}
              aria-describedby="chat-address-status"
            />
            <span className={`field-hint ${addressStatus.type === "error" ? "error" : ""}`} id="chat-address-status">
              {addressStatus.message}
            </span>
          </label>
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
            {submitting ? t.sending : t.send}
          </button>
          <p className={`status ${status.type === "error" ? "error" : status.type === "success" ? "success" : ""}`}>
            {status.message}
          </p>
          {pdfUrl ? (
            <div className="chat-pdf-download">
              <p>{t.pdfReady}</p>
              <a className="button primary" href={pdfUrl} download="medina-clean-estimate.pdf">
                {t.pdfDownload}
              </a>
            </div>
          ) : null}
        </form>
      ) : null}

      <div className="chat-quick-answers">
        <h4>{t.quickTitle}</h4>
        <details>
          <summary>{t.materialsQuestion}</summary>
          <p>{t.materialsAnswer}</p>
        </details>
        <details>
          <summary>{t.serviceAreaQuestion}</summary>
          <p>{t.serviceAreaAnswer}</p>
        </details>
        <details>
          <summary>{t.privacyQuestion}</summary>
          <p>{t.privacyAnswer}</p>
        </details>
      </div>
    </article>
  );
}

async function buildPdfDownloadUrl(details: Parameters<typeof buildEstimatePdfLines>[0]) {
  const logo = await loadLogo();
  const lines = buildEstimatePdfLines(details);
  return URL.createObjectURL(createEstimatePdf(lines, logo));
}

function getChatTurnIndex() {
  const value = Number(window.sessionStorage.getItem(chatTurnStorageKey));
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function setChatTurnIndex(value: number) {
  window.sessionStorage.setItem(chatTurnStorageKey, String(Math.max(0, value)));
}

async function loadLogo(): Promise<PdfLogoImage | undefined> {
  try {
    const image = await loadImage("/brand/medina-clean-logo.png");
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      return undefined;
    }

    return {
      data: new Uint8Array(await blob.arrayBuffer()),
      width: canvas.width,
      height: canvas.height
    };
  } catch {
    return undefined;
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo could not be loaded."));
    image.src = src;
  });
}

function isEstimateReply(content: string) {
  return /rough estimate|rough one-time estimate|estimado aproximado|estimado de una vez/i.test(content);
}
