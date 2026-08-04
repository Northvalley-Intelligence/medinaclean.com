import { copy, pricing } from "./content";
import { extractZip, validateServiceArea, validateServiceAreaMessage } from "./service-area";

// GEN-001 TASK-006 — read-only MCP tools (check_service_area, list_services, get_pricing_rules).
// Thin adapters over existing site data/logic: no parallel service-area or pricing source (RISK-008),
// bilingual by reusing the site's maintained EN/ES copy (RISK-009).

export type McpLanguage = "en" | "es";

export type CheckServiceAreaInput = {
  zip: string;
  language?: McpLanguage;
};

export type CheckServiceAreaResult = {
  eligible: boolean;
  zip: string;
  distanceMiles: number | null;
  message: string;
};

export function checkServiceArea(input: CheckServiceAreaInput): CheckServiceAreaResult {
  const language: McpLanguage = input.language === "es" ? "es" : "en";
  const zip = extractZip(String(input.zip ?? ""));

  if (!zip) {
    return {
      eligible: false,
      zip: "",
      distanceMiles: null,
      message:
        language === "es"
          ? "Comparte un código postal de 5 dígitos para que Rosa revise el área de servicio."
          : "Share a 5-digit ZIP code so Rosa can check the service area."
    };
  }

  const validation = validateServiceArea(zip);
  const localized = validateServiceAreaMessage(zip, language);

  return {
    eligible: validation.ok,
    zip,
    distanceMiles: validation.distanceMiles,
    message: localized.message
  };
}

export type ServiceListItem = {
  code: string;
  label: string;
  description: string;
};

// Fixed order matches copy[language].services.items in content.ts.
const serviceCodes = ["houses", "apartments", "condos", "small_business", "post_construction"] as const;

export function listServices(language: McpLanguage = "en"): ServiceListItem[] {
  const lang: McpLanguage = language === "es" ? "es" : "en";
  const items = copy[lang].services.items;

  return items.map(([label, description], index) => ({
    code: serviceCodes[index] ?? `service_${index}`,
    label,
    description
  }));
}

export type PricingRulesResult = {
  rules: typeof pricing;
  disclaimers: string[];
};

export function getPricingRules(): PricingRulesResult {
  return {
    rules: pricing,
    disclaimers: ["standard_materials_and_conditions", "rosa_confirms_final_price"]
  };
}
