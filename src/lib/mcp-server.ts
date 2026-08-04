import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpEstimate } from "./mcp-estimate";
import { checkServiceArea, getPricingRules, listServices } from "./mcp-readonly-tools";
import { requestAppointment } from "./mcp-request-appointment";

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

export function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: "medina-clean", version: "1.0.0" },
    {
      instructions:
        "Book a Medina Clean house cleaning near Woodstock, GA. Typical flow: call check_service_area with the ZIP, then get_estimate for a starting price, then request_appointment. request_appointment only REQUESTS an appointment — Rosa reviews and confirms; it never confirms a booking."
    }
  );

  server.registerTool(
    "check_service_area",
    {
      title: "Check service area",
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
      description:
        "Give an instant STARTING estimate (Rosa confirms the final price after seeing the property). Run check_service_area first. small_business and post-construction return no auto-quote (Rosa estimates onsite). Every priced estimate carries assumptions/disclaimers.",
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
      toolResult(getMcpEstimate({ bedrooms, bathrooms, frequency, addons, condition }))
  );

  server.registerTool(
    "request_appointment",
    {
      title: "Request an appointment",
      description:
        "Submit an appointment REQUEST to Rosa. This does NOT confirm the appointment — Rosa reviews the address, timing, and property before accepting, then contacts the customer. Run check_service_area first. Collect name, phone, address, ZIP, service type, bedrooms, bathrooms, and up to three preferred times.",
      inputSchema: {
        name: z.string().describe("Customer full name."),
        phone: z.string().describe("US phone number Rosa can call/text."),
        address: z.string().describe("Service street address."),
        zip: z.string().describe("Service ZIP code (must be in-area)."),
        service_type: z.string().describe("Service type, e.g. 'Every 2 weeks' or 'First-time / one-time'."),
        bedrooms: z.number().int().min(1).max(5),
        bathrooms: z.number().min(1).max(6),
        preferred_times: z
          .array(z.string())
          .min(1)
          .max(3)
          .describe("Up to three preferred date/times (ISO-8601 preferred)."),
        notes: z.string().optional().describe("Optional notes (pets, access, special requests)."),
        language: languageSchema,
        honeypot: z.string().optional().describe("Anti-spam field. Leave empty."),
        secret: z.string().optional().describe("Optional shared secret if the deployment requires one.")
      }
    },
    async (input) => toolResult(await requestAppointment(input))
  );

  return server;
}
