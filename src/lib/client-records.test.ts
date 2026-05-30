import { describe, expect, it } from "vitest";
import { parseClientPayload } from "./client-records";

describe("client-records", () => {
  it("maps a client onboarding form to a Supabase row", () => {
    const result = parseClientPayload({
      name: "  Maria   Smith  ",
      phone: "(470) 555-0100",
      email: " maria@example.com ",
      address: "Woodstock, GA",
      zipCode: "30188",
      preferredLanguage: "es",
      preferredCommunicationChannel: "email",
      cleaningFrequency: "every_2_weeks",
      currentPriceUsd: "$150",
      usualDay: "Tuesday",
      usualTime: "Morning",
      canAskForReview: "on",
      canAskForReferral: "on",
      notes: "Has pets"
    });

    expect(result).toEqual({
      ok: true,
      row: {
        name: "Maria Smith",
        phone: "+14705550100",
        email: "maria@example.com",
        address: "Woodstock, GA",
        zip_code: "30188",
        preferred_language: "es",
        preferred_communication_channel: "email",
        cleaning_frequency: "every_2_weeks",
        usual_day: "Tuesday",
        usual_time: "Morning",
        current_price_usd: 150,
        status: "active",
        source: "existing_client",
        can_ask_for_review: true,
        can_ask_for_referral: true,
        notes: "Has pets"
      }
    });
  });

  it("rejects missing names, malformed phone numbers, malformed ZIP codes, and invalid prices", () => {
    const result = parseClientPayload({
      phone: "555",
      email: "bad-email",
      zipCode: "abc",
      currentPriceUsd: "-1"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Client name is required.");
      expect(result.errors).toContain("Phone must be a valid 10-digit US number.");
      expect(result.errors).toContain("Email must be valid.");
      expect(result.errors).toContain("ZIP code must be 5 digits.");
      expect(result.errors).toContain("Current price must be a positive number.");
    }
  });

  it("defaults unknown option values to safe values", () => {
    const result = parseClientPayload({
      name: "Client",
      phone: "(470) 555-0100",
      preferredLanguage: "fr",
      preferredCommunicationChannel: "carrier-pigeon",
      cleaningFrequency: "daily",
      status: "archived"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.preferred_language).toBe("en");
      expect(result.row.preferred_communication_channel).toBe("email");
      expect(result.row.cleaning_frequency).toBe("unknown");
      expect(result.row.status).toBe("active");
    }
  });
});
