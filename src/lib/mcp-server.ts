import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpEstimate } from "./mcp-estimate";
import { checkServiceArea, getPricingRules, listServices } from "./mcp-readonly-tools";
import { requestAppointment } from "./mcp-request-appointment";
import {
  APPOINTMENT_FORM_TEMPLATE_URI,
  ESTIMATE_CARD_TEMPLATE_URI,
  UI_TEMPLATE_MIME_TYPE,
  appointmentRequestTemplateHtml,
  estimateCardTemplateHtml
} from "./mcp-ui";

// GEN-001 TASK-007 — the agent-native MCP server. Registers the five tools over the existing
// business logic (TASK-005/006/008/009). Descriptions are action-oriented and carry chaining hints
// (check_service_area -> get_estimate -> request_appointment) refined further in TASK-010.
// The write path REQUESTS; it never confirms (RISK-005).

const languageSchema = z
  .enum(["en", "es"])
  .optional()
  .describe("Response language: 'en' or 'es'. Default 'en'. Use 'es' for Spanish-speaking customers.");

function toolResult(result: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
}

// For tools that drive an inline UI: return structuredContent (with language) so the output-template
// resource can render the card/form before the model's text.
function toolResultWithUi(result: Record<string, unknown>, language: "en" | "es") {
  const structured = { ...result, language };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structured) }],
    structuredContent: structured
  };
}

export type BuildMcpServerOptions = {
  // Optional deployment write-secret, sourced ONLY from a transport-level header/env by the
  // caller (src/app/mcp/route.ts reads it off the Authorization header) — never a user-facing
  // tool argument. See mcp-request-appointment.ts for the OpenAI-resubmission PII minimization
  // note (2026-08-22).
  writeSecret?: string;
};

export function buildMcpServer(options: BuildMcpServerOptions = {}): McpServer {
  const { writeSecret } = options;
  const server = new McpServer(
    { name: "medina-clean", version: "1.0.0" },
    {
      instructions:
        "Book a Medina Clean house cleaning near Woodstock, GA. Typical flow: call check_service_area with the ZIP, then get_estimate for a starting price, then request_appointment. request_appointment only REQUESTS an appointment — Rosa reviews and confirms; it never confirms a booking."
    }
  );

  // Inline UI templates (TASK-011) rendered from tool structuredContent by UI-capable assistants.
  server.registerResource(
    "estimate-card",
    ESTIMATE_CARD_TEMPLATE_URI,
    { title: "Estimate card", mimeType: UI_TEMPLATE_MIME_TYPE },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: UI_TEMPLATE_MIME_TYPE, text: estimateCardTemplateHtml() }]
    })
  );
  server.registerResource(
    "appointment-request",
    APPOINTMENT_FORM_TEMPLATE_URI,
    { title: "Appointment request", mimeType: UI_TEMPLATE_MIME_TYPE },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: UI_TEMPLATE_MIME_TYPE, text: appointmentRequestTemplateHtml() }]
    })
  );

  server.registerTool(
    "check_service_area",
    {
      title: "Check service area",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      description:
        "Check whether a US ZIP code is inside Medina Clean's cleaning service area (about 20 miles of Woodstock, GA 30188). Call this FIRST, before get_estimate or request_appointment. Returns eligibility and a customer-facing message.",
      inputSchema: {
        zip: z.string().describe("US ZIP code (5 digits). Free text like 'I'm in 30188' is accepted."),
        language: languageSchema
      }
    },
    async ({ zip, language }) => toolResult(checkServiceArea({ zip, language }))
  );

  server.registerTool(
    "list_services",
    {
      title: "List cleaning services",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      description:
        "List the cleaning services Medina Clean offers: houses, apartments, condos, small business, and post-construction cleanup.",
      inputSchema: { language: languageSchema }
    },
    async ({ language }) => toolResult(listServices(language ?? "en"))
  );

  server.registerTool(
    "get_pricing_rules",
    {
      title: "Get pricing rules",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      description:
        "Get Medina Clean's published starting-rate pricing rules as structured data. Use this to explain how estimates are calculated.",
      inputSchema: {}
    },
    async () => toolResult(getPricingRules())
  );

  server.registerTool(
    "get_estimate",
    {
      title: "Get a starting estimate",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      description:
        "Give an instant STARTING estimate (Rosa confirms the final price after seeing the property). Run check_service_area first. small_business and post-construction return no auto-quote (Rosa estimates onsite). Every priced estimate carries assumptions/disclaimers.",
      _meta: { "openai/outputTemplate": ESTIMATE_CARD_TEMPLATE_URI },
      inputSchema: {
        bedrooms: z.number().int().min(1).max(5).describe("Number of bedrooms (1-5)."),
        bathrooms: z.number().min(1).max(6).describe("Number of bathrooms (1-6)."),
        frequency: z
          .enum(["biweekly", "triweekly", "first_time_onetime", "small_business"])
          .describe("biweekly = every 2 weeks, triweekly = every 3 weeks, first_time_onetime, or small_business."),
        addons: z.array(z.enum(["oven_fridge"])).optional().describe("Optional add-ons, e.g. oven_fridge."),
        condition: z
          .enum(["standard", "heavy"])
          .optional()
          .describe("Property/add-on condition. 'heavy' raises add-on pricing. Default 'standard'.")
      }
    },
    async ({ bedrooms, bathrooms, frequency, addons, condition }) =>
      toolResultWithUi(getMcpEstimate({ bedrooms, bathrooms, frequency, addons, condition }), "en")
  );

  server.registerTool(
    "request_appointment",
    {
      title: "Request an appointment",
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      description:
        "Submit an appointment REQUEST to Rosa. This does NOT confirm the appointment — Rosa reviews the address, timing, and property before accepting, then contacts the customer. Run check_service_area first. " +
        "Collects only what an in-home cleaning visit requires: name, phone, and address/ZIP (so Rosa can identify, reach, and travel to the customer to review and confirm the request), plus service type, bedrooms, bathrooms, and up to three preferred times. " +
        "Used solely to review and confirm this request — never sold, never used for anything else. Details: https://medinaclean.com/privacy",
      _meta: { "openai/outputTemplate": APPOINTMENT_FORM_TEMPLATE_URI },
      inputSchema: {
        name: z.string().describe("Customer full name. Used only so Rosa can identify who the request is for."),
        phone: z.string().describe("US phone number Rosa can call/text to confirm the request."),
        address: z.string().describe("Service street address. Used only so Rosa can confirm the property and travel to it."),
        zip: z.string().describe("Service ZIP code (must be in-area)."),
        service_type: z.string().describe("Service type, e.g. 'Every 2 weeks' or 'First-time / one-time'."),
        bedrooms: z.number().int().min(1).max(5),
        bathrooms: z.number().min(1).max(6),
        preferred_times: z
          .array(z.string())
          .min(1)
          .max(3)
          .describe("Up to three preferred date/times (ISO-8601 preferred)."),
        notes: z
          .string()
          .optional()
          .describe(
            "Brief access/scheduling notes only (e.g. pets, gate code, parking). Do NOT include health, payment, ID/SSN, or other sensitive information — such notes are rejected."
          ),
        language: languageSchema,
        honeypot: z.string().optional().describe("Anti-spam field. Leave empty.")
      }
    },
    async (input) =>
      toolResultWithUi(
        await requestAppointment({ ...input, secret: writeSecret }),
        input.language === "es" ? "es" : "en"
      )
  );

  return server;
}
