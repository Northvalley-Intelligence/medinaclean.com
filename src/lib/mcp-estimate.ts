import { calculateCleaningEstimate, type ChatFrequency, type CleaningAddOnCondition } from "./chat-agent";

// GEN-001 TASK-005 — get_estimate tool (agent-native MCP booking lane).
//
// This is an ADAPTER over the site's existing pricing engine (chat-agent.calculateCleaningEstimate),
// not a second pricing implementation (RISK-008: no parallel intake/pricing path). It maps the
// assistant-facing vocabulary onto the engine, adds the small_business no-auto-quote path, and
// always returns disclaimer CODES so the presentation layer can localize EN/ES (RISK-009).

export type McpEstimateFrequency = "biweekly" | "triweekly" | "first_time_onetime" | "small_business";
export type McpEstimateCondition = "standard" | "heavy";
export type McpAddOn = "oven_fridge";

export type McpEstimateInput = {
  bedrooms: number;
  bathrooms: number;
  frequency: McpEstimateFrequency;
  addons?: McpAddOn[];
  condition?: McpEstimateCondition;
};

export type McpEstimateBreakdown = {
  rooms: number;
  ratePerRoomUsd: number | null;
  baseEstimateUsd: number | null;
  addOnEstimateUsd: number;
  addOns: { type: McpAddOn; priceUsd: number }[];
  frequency: McpEstimateFrequency;
  engineFrequency: ChatFrequency;
};

export type McpEstimateResult = {
  estimate: number | null;
  currency: "USD";
  autoQuote: boolean;
  breakdown: McpEstimateBreakdown;
  disclaimers: string[];
};

// Published bounds (CODEX Forms rules / appointment-request validation): bedrooms 1-5, bathrooms 1-6.
const MIN_BEDROOMS = 1;
const MAX_BEDROOMS = 5;
const MIN_BATHROOMS = 1;
const MAX_BATHROOMS = 6;

const engineFrequencyByRequest: Record<McpEstimateFrequency, ChatFrequency> = {
  biweekly: "every_2_weeks",
  triweekly: "every_3_weeks",
  first_time_onetime: "one_time",
  small_business: "post_construction"
};

export function getMcpEstimate(input: McpEstimateInput): McpEstimateResult {
  const bedrooms = boundNumber(input.bedrooms, MIN_BEDROOMS, MAX_BEDROOMS);
  const bathrooms = boundNumber(input.bathrooms, MIN_BATHROOMS, MAX_BATHROOMS);
  const rooms = Number((bedrooms + bathrooms).toFixed(1));
  const engineFrequency = engineFrequencyByRequest[input.frequency];
  const addOnCondition: CleaningAddOnCondition = input.condition === "heavy" ? "very_dirty" : "standard";

  // small_business / post-construction: no auto-quote — never emit a number (RISK-010).
  if (input.frequency === "small_business") {
    return {
      estimate: null,
      currency: "USD",
      autoQuote: false,
      breakdown: {
        rooms,
        ratePerRoomUsd: null,
        baseEstimateUsd: null,
        addOnEstimateUsd: 0,
        addOns: [],
        frequency: input.frequency,
        engineFrequency
      },
      disclaimers: ["onsite_estimate_required", "rosa_confirms_final_price"]
    };
  }

  const engine = calculateCleaningEstimate({
    bedrooms,
    bathrooms,
    frequency: engineFrequency,
    addOns: (input.addons ?? []).map(() => ({ type: "oven_and_fridge", condition: addOnCondition }))
  });

  const estimate =
    input.frequency === "first_time_onetime" ? engine.oneTimeEstimateUsd : engine.recurringEstimateUsd;
  const baseEstimateUsd = estimate === null ? null : estimate - engine.addOnEstimateUsd;

  const disclaimers = ["standard_materials_and_conditions", "rosa_confirms_final_price"];
  if (input.frequency === "first_time_onetime") {
    disclaimers.push("first_time_is_double_recurring_assumption");
  }

  return {
    estimate,
    currency: "USD",
    autoQuote: estimate !== null,
    breakdown: {
      rooms,
      ratePerRoomUsd: engine.ratePerRoomUsd,
      baseEstimateUsd,
      addOnEstimateUsd: engine.addOnEstimateUsd,
      addOns: engine.addOns.map((addOn) => ({ type: "oven_fridge", priceUsd: addOn.priceUsd })),
      frequency: input.frequency,
      engineFrequency
    },
    disclaimers
  };
}

function boundNumber(value: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.min(max, Math.max(min, numeric));
}
