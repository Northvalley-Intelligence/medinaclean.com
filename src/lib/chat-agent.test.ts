import { describe, expect, it } from "vitest";
import {
  buildChatAppointmentNotes,
  calculateCleaningEstimate,
  negotiateCleaningEstimate,
  normalizeChatFrequency
} from "./chat-agent";

describe("chat agent pricing", () => {
  it("quotes recurring and first-cleaning estimates from rooms and frequency", () => {
    expect(calculateCleaningEstimate({ bedrooms: 3, bathrooms: 2, frequency: "every_2_weeks" })).toMatchObject({
      rooms: 5,
      recurringEstimateUsd: 150,
      firstCleaningEstimateUsd: 300,
      ratePerRoomUsd: 30,
      frequency: "every_2_weeks"
    });

    expect(calculateCleaningEstimate({ bedrooms: 3, bathrooms: 2.5, frequency: "every_3_weeks" })).toMatchObject({
      rooms: 5.5,
      recurringEstimateUsd: 220,
      firstCleaningEstimateUsd: 440,
      oneTimeEstimateUsd: 440,
      ratePerRoomUsd: 40
    });
  });

  it("keeps Rosa's room-rate dollar amounts explicit for provider validation", () => {
    expect(calculateCleaningEstimate({ bedrooms: 1, bathrooms: 1, frequency: "every_2_weeks" })).toMatchObject({
      ratePerRoomUsd: 30,
      recurringEstimateUsd: 60,
      firstCleaningEstimateUsd: 120
    });
    expect(calculateCleaningEstimate({ bedrooms: 1, bathrooms: 1, frequency: "every_3_weeks" })).toMatchObject({
      ratePerRoomUsd: 40,
      recurringEstimateUsd: 80,
      firstCleaningEstimateUsd: 160
    });
    expect(calculateCleaningEstimate({ bedrooms: 1, bathrooms: 1, frequency: "one_time" })).toMatchObject({
      ratePerRoomUsd: 40,
      recurringEstimateUsd: null,
      oneTimeEstimateUsd: 160
    });
  });

  it("adds oven and refrigerator cleaning together at $50 normally or $80 when very dirty", () => {
    expect(
      calculateCleaningEstimate({
        bedrooms: 3,
        bathrooms: 2,
        frequency: "every_2_weeks",
        addOns: [{ type: "oven_and_fridge", condition: "very_dirty" }]
      })
    ).toMatchObject({
      addOnEstimateUsd: 80,
      recurringEstimateUsd: 230,
      firstCleaningEstimateUsd: 460,
      addOns: [{ type: "oven_and_fridge", condition: "very_dirty", priceUsd: 80 }]
    });

    expect(
      calculateCleaningEstimate({
        bedrooms: 3,
        bathrooms: 2,
        frequency: "every_2_weeks",
        addOns: [{ type: "oven_and_fridge", condition: "standard" }]
      })
    ).toMatchObject({
      addOnEstimateUsd: 50,
      recurringEstimateUsd: 200,
      firstCleaningEstimateUsd: 400
    });
  });

  it("does not quote post-construction cleanup before onsite inspection", () => {
    const estimate = calculateCleaningEstimate({
      bedrooms: 3,
      bathrooms: 2,
      frequency: "post_construction"
    });

    expect(estimate).toMatchObject({
      recurringEstimateUsd: null,
      firstCleaningEstimateUsd: 0,
      oneTimeEstimateUsd: 0,
      frequency: "post_construction"
    });
    expect(buildChatAppointmentNotes({ estimate })).toContain(
      "post-construction cleanup requires an onsite inspection"
    );
  });


  it("uses the three-week room rate for one-time cleaning", () => {
    expect(calculateCleaningEstimate({ bedrooms: 2, bathrooms: 1, frequency: "one_time" })).toMatchObject({
      rooms: 3,
      recurringEstimateUsd: null,
      firstCleaningEstimateUsd: 240,
      oneTimeEstimateUsd: 240,
      ratePerRoomUsd: 40
    });
  });

  it("only accepts a lower amount within $50 when the client is ready for every two weeks", () => {
    const estimate = calculateCleaningEstimate({ bedrooms: 3, bathrooms: 2, frequency: "every_2_weeks" });

    expect(negotiateCleaningEstimate(estimate, 125, true)).toEqual({
      accepted: true,
      adjustedRecurringEstimateUsd: 125,
      adjustedFirstCleaningEstimateUsd: 250,
      message: "accepted_within_range"
    });

    expect(negotiateCleaningEstimate(estimate, 90, true)).toMatchObject({
      accepted: false,
      message: "too_low_for_auto_adjustment"
    });

    expect(negotiateCleaningEstimate(estimate, 125, false)).toMatchObject({
      accepted: false,
      message: "requires_every_two_weeks"
    });
  });

  it("builds private appointment notes with estimate details", () => {
    const notes = buildChatAppointmentNotes({
      estimate: calculateCleaningEstimate({
        bedrooms: 3,
        bathrooms: 2,
        frequency: "every_2_weeks",
        addOns: [{ type: "oven_and_fridge", condition: "standard" }]
      }),
      adjustedRecurringEstimateUsd: 125,
      extraNotes: "Has two dogs."
    });

    expect(notes).toContain("Chat estimate: first cleaning $250, recurring $125 every 2 weeks.");
    expect(notes).toContain("Add-ons: oven and refrigerator $50.");
    expect(notes).toContain("Customer notes: Has two dogs.");
  });

  it("normalizes frequency labels from chat choices", () => {
    expect(normalizeChatFrequency("Every 2 weeks")).toBe("every_2_weeks");
    expect(normalizeChatFrequency("cada 3 semanas")).toBe("every_3_weeks");
    expect(normalizeChatFrequency("one time")).toBe("one_time");
    expect(normalizeChatFrequency("post construction cleanup")).toBe("post_construction");
  });
});
