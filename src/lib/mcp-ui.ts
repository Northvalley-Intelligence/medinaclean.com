// GEN-001 TASK-011 — inline UI for the agent-native lane, delivered as MCP UI resources.
//
// These are self-contained HTML templates (inline CSS/JS, no external assets) registered as MCP
// resources and referenced from the get_estimate / request_appointment tools via the
// `openai/outputTemplate` _meta convention. A UI-capable assistant renders them from the tool's
// structuredContent, so key info (price, disclaimers, the request-not-confirmed trust line) is
// carried visually before the model's text (RISK-011).
//
// NOTE: a ChatGPT-native polish pass using @openai/apps-sdk-ui + Tailwind design tokens is a
// documented follow-up done during live ChatGPT testing (that runtime can only be verified inside
// ChatGPT developer mode). Claude, the first-proof path, renders the structuredContent directly.

export const ESTIMATE_CARD_TEMPLATE_URI = "ui://medina-clean/estimate-card";
export const APPOINTMENT_FORM_TEMPLATE_URI = "ui://medina-clean/appointment-request";
export const UI_TEMPLATE_MIME_TYPE = "text/html+skybridge";

const baseStyles = `
  :root { color-scheme: light dark; }
  .mc-card { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 420px;
    border: 1px solid #f0c8d8; border-radius: 14px; padding: 18px 20px; background: #fff7fb; color: #3a2230; }
  .mc-title { font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #b53a75; }
  .mc-price { font-size: 30px; font-weight: 700; margin: 4px 0; }
  .mc-row { font-size: 14px; margin: 2px 0; }
  .mc-note { font-size: 12px; color: #6b5060; margin-top: 10px; line-height: 1.4; }
  .mc-trust { font-size: 12px; font-weight: 600; color: #8a2d5c; margin-top: 10px; }
  @media (prefers-color-scheme: dark) {
    .mc-card { background: #241019; border-color: #5a2a40; color: #f6e7ee; }
    .mc-note { color: #cda8ba; }
  }
`;

// Reads the tool's structuredContent from the Apps SDK bridge (window.openai.toolOutput) when
// present, and degrades to a static message otherwise.
export function estimateCardTemplateHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div id="mc-root" class="mc-card"></div>
<script>
(function () {
  var data = (window.openai && window.openai.toolOutput) || {};
  var es = data.language === "es";
  var root = document.getElementById("mc-root");
  var t = {
    title: es ? "Estimado inicial de Medina Clean" : "Medina Clean starting estimate",
    onsite: es ? "Rosa da el precio tras revisar la propiedad." : "Rosa estimates onsite after reviewing the property.",
    trust: es ? "Estimado inicial — Rosa confirma el precio final." : "Starting estimate — Rosa confirms the final price."
  };
  var html = '<p class="mc-title">' + t.title + '</p>';
  if (data.estimate == null) {
    html += '<p class="mc-row">' + t.onsite + '</p>';
  } else {
    html += '<p class="mc-price">$' + data.estimate + ' <span style="font-size:13px;font-weight:400">' + (data.currency || "USD") + '</span></p>';
    if (data.breakdown) {
      html += '<p class="mc-row">' + (data.breakdown.rooms || "") + ' rooms</p>';
    }
  }
  html += '<p class="mc-trust">' + t.trust + '</p>';
  root.innerHTML = html;
})();
</script>
</body></html>`;
}

export function appointmentRequestTemplateHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div id="mc-root" class="mc-card"></div>
<script>
(function () {
  var data = (window.openai && window.openai.toolOutput) || {};
  var es = data.language === "es";
  var root = document.getElementById("mc-root");
  var ok = data.status === "pending_review";
  var t = {
    sent: es ? "Solicitud enviada a Rosa" : "Request sent to Rosa",
    ref: es ? "Referencia" : "Reference",
    trust: es
      ? "Esto NO confirma la cita. Rosa revisará la dirección y los horarios y te contactará."
      : "This does NOT confirm the appointment. Rosa will review the address and times and contact you.",
    failed: es ? "No se pudo enviar la solicitud." : "The request could not be sent."
  };
  var html = '<p class="mc-title">' + (ok ? t.sent : t.failed) + '</p>';
  if (ok && data.request_id) { html += '<p class="mc-row">' + t.ref + ': ' + data.request_id + '</p>'; }
  if (data.message) { html += '<p class="mc-row">' + data.message + '</p>'; }
  if (ok) { html += '<p class="mc-trust">' + t.trust + '</p>'; }
  root.innerHTML = html;
})();
</script>
</body></html>`;
}
