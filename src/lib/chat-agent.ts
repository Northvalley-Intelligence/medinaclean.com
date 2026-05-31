export type ChatFrequency = "every_2_weeks" | "every_3_weeks" | "one_time" | "post_construction";
export type CleaningAddOnType = "oven_and_fridge";
export type CleaningAddOnCondition = "standard" | "very_dirty";

export type CleaningAddOnInput = {
  type: CleaningAddOnType;
  condition: CleaningAddOnCondition;
};

export type CleaningAddOnEstimate = CleaningAddOnInput & {
  priceUsd: number;
};

export type CleaningEstimateInput = {
  bedrooms: number;
  bathrooms: number;
  frequency: ChatFrequency;
  addOns?: CleaningAddOnInput[];
};

export type CleaningEstimate = {
  rooms: number;
  recurringEstimateUsd: number | null;
  firstCleaningEstimateUsd: number;
  oneTimeEstimateUsd: number;
  ratePerRoomUsd: number;
  addOnEstimateUsd: number;
  addOns: CleaningAddOnEstimate[];
  frequency: ChatFrequency;
};

const twoWeekRate = 30;
const threeWeekRate = 40;
const standardAddOnRate = 50;
const veryDirtyAddOnRate = 80;

export function normalizeChatFrequency(value: string): ChatFrequency {
  const normalized = value.trim().toLowerCase();

  if (/2|two|dos/.test(normalized)) {
    return "every_2_weeks";
  }

  if (/3|three|tres/.test(normalized)) {
    return "every_3_weeks";
  }

  if (/construction|construcci[oó]n|obra|post/.test(normalized)) {
    return "post_construction";
  }

  return "one_time";
}

export function calculateCleaningEstimate(input: CleaningEstimateInput): CleaningEstimate {
  const bedrooms = boundNumber(input.bedrooms, 1, 8);
  const bathrooms = boundNumber(input.bathrooms, 1, 8);
  const rooms = Number((bedrooms + bathrooms).toFixed(1));
  const ratePerRoomUsd = input.frequency === "every_2_weeks" ? twoWeekRate : threeWeekRate;
  const addOns = estimateAddOns(input.addOns || []);
  const addOnEstimateUsd = addOns.reduce((total, addOn) => total + addOn.priceUsd, 0);
  const recurringBaseEstimateUsd =
    input.frequency === "one_time" || input.frequency === "post_construction" ? null : roundMoney(rooms * ratePerRoomUsd);
  const recurringEstimateUsd = recurringBaseEstimateUsd === null ? null : recurringBaseEstimateUsd + addOnEstimateUsd;
  const oneTimeEstimateUsd =
    input.frequency === "post_construction" ? addOnEstimateUsd : roundMoney(rooms * threeWeekRate * 2) + addOnEstimateUsd;
  const firstCleaningEstimateUsd =
    input.frequency === "one_time" ? oneTimeEstimateUsd : roundMoney((recurringEstimateUsd || 0) * 2);

  return {
    rooms,
    recurringEstimateUsd,
    firstCleaningEstimateUsd,
    oneTimeEstimateUsd,
    ratePerRoomUsd,
    addOnEstimateUsd,
    addOns,
    frequency: input.frequency
  };
}

export function negotiateCleaningEstimate(
  estimate: CleaningEstimate,
  requestedRecurringAmountUsd: number,
  readyForEveryTwoWeeks: boolean
) {
  if (estimate.frequency !== "every_2_weeks" || !readyForEveryTwoWeeks) {
    return {
      accepted: false as const,
      adjustedRecurringEstimateUsd: null,
      adjustedFirstCleaningEstimateUsd: null,
      message: "requires_every_two_weeks" as const
    };
  }

  const original = estimate.recurringEstimateUsd;
  const requested = roundMoney(requestedRecurringAmountUsd);
  if (!original || requested <= 0 || requested < original - 50 || requested > original) {
    return {
      accepted: false as const,
      adjustedRecurringEstimateUsd: null,
      adjustedFirstCleaningEstimateUsd: null,
      message: "too_low_for_auto_adjustment" as const
    };
  }

  return {
    accepted: true as const,
    adjustedRecurringEstimateUsd: requested,
    adjustedFirstCleaningEstimateUsd: roundMoney(requested * 2),
    message: "accepted_within_range" as const
  };
}

export function buildChatAppointmentNotes({
  estimate,
  adjustedRecurringEstimateUsd,
  extraNotes
}: {
  estimate: CleaningEstimate;
  adjustedRecurringEstimateUsd?: number | null;
  extraNotes?: string;
}) {
  const recurring = adjustedRecurringEstimateUsd ?? estimate.recurringEstimateUsd;
  const firstCleaning = recurring ? recurring * 2 : estimate.firstCleaningEstimateUsd;
  const lines = [
    estimate.frequency === "post_construction"
      ? "Chat estimate: post-construction cleanup requires an onsite inspection before Rosa gives a price."
      : recurring
        ? `Chat estimate: first cleaning $${firstCleaning}, recurring $${recurring} ${frequencyLabel(estimate.frequency)}.`
        : `Chat estimate: one-time cleaning $${estimate.oneTimeEstimateUsd}.`,
    "Estimate is rough. Rosa confirms the final amount after seeing the property."
  ];

  if (estimate.addOns.length > 0) {
    lines.push(`Add-ons: ${estimate.addOns.map((addOn) => `${addOnLabel(addOn.type)} $${addOn.priceUsd}`).join(", ")}.`);
  }

  const cleanedNotes = clean(extraNotes, 800);
  if (cleanedNotes) {
    lines.push(`Customer notes: ${cleanedNotes}`);
  }

  return lines.join("\n");
}

export function chatServiceType(frequency: ChatFrequency) {
  if (frequency === "every_2_weeks") {
    return "Every 2 weeks - chat estimate";
  }

  if (frequency === "every_3_weeks") {
    return "Every 3 weeks - chat estimate";
  }

  if (frequency === "post_construction") {
    return "Post-construction cleanup - onsite estimate";
  }

  return "First-time / one-time cleaning - chat estimate";
}

function frequencyLabel(frequency: ChatFrequency) {
  if (frequency === "every_2_weeks") {
    return "every 2 weeks";
  }

  if (frequency === "every_3_weeks") {
    return "every 3 weeks";
  }

  if (frequency === "post_construction") {
    return "post construction";
  }

  return "one time";
}

function boundNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number) {
  return Math.round(value);
}

function estimateAddOns(addOns: CleaningAddOnInput[]): CleaningAddOnEstimate[] {
  return addOns.map((addOn) => ({
    type: addOn.type,
    condition: addOn.condition,
    priceUsd: addOn.condition === "very_dirty" ? veryDirtyAddOnRate : standardAddOnRate
  }));
}

function addOnLabel(type: CleaningAddOnType) {
  if (type === "oven_and_fridge") {
    return "oven and refrigerator";
  }

  return type;
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
