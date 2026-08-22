import { describe, expect, it } from "vitest";
import {
  containsSensitivePattern,
  enforceAppointmentRateLimit,
  evaluateThrottle,
  isHoneypotTripped,
  validateRequestPhone,
  verifySharedSecret,
  windowStartIso
} from "./mcp-abuse-protection";

describe("validateRequestPhone", () => {
  it("accepts and normalizes a valid US phone", () => {
    expect(validateRequestPhone("(470) 781-4143")).toEqual({
      ok: true,
      e164: "+14707814143",
      display: "(470) 781-4143"
    });
  });

  it("rejects an invalid phone", () => {
    expect(validateRequestPhone("123")).toEqual({ ok: false, error: "invalid_phone" });
    expect(validateRequestPhone("")).toEqual({ ok: false, error: "invalid_phone" });
  });
});

describe("isHoneypotTripped", () => {
  it("is tripped only when the hidden field is filled", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped("   ")).toBe(false);
    expect(isHoneypotTripped("http://spam")).toBe(true);
  });
});

describe("verifySharedSecret", () => {
  it("is disabled (allows) when no secret is configured", () => {
    expect(verifySharedSecret("anything", "")).toBe(true);
    expect(verifySharedSecret("", undefined)).toBe(true);
  });

  it("requires an exact match when a secret is configured", () => {
    expect(verifySharedSecret("s3cret", "s3cret")).toBe(true);
    expect(verifySharedSecret("wrong", "s3cret")).toBe(false);
    expect(verifySharedSecret("", "s3cret")).toBe(false);
  });
});

describe("containsSensitivePattern", () => {
  it("is false for ordinary scheduling notes", () => {
    expect(containsSensitivePattern("Has a dog, please use the side gate")).toBe(false);
    expect(containsSensitivePattern("")).toBe(false);
    expect(containsSensitivePattern(undefined)).toBe(false);
  });

  it("does not false-positive on phone numbers, addresses, or ISO times", () => {
    expect(containsSensitivePattern("Call (470) 781-4143 before arriving")).toBe(false);
    expect(containsSensitivePattern("Gate code near 100 Main Street, 30188")).toBe(false);
    expect(containsSensitivePattern("Prefer 2026-08-10T09:00 if possible")).toBe(false);
  });

  it("flags a US SSN format", () => {
    expect(containsSensitivePattern("My SSN is 123-45-6789")).toBe(true);
  });

  it("flags a Luhn-valid, formatted card number", () => {
    expect(containsSensitivePattern("Card: 4111 1111 1111 1111")).toBe(true);
    expect(containsSensitivePattern("4111-1111-1111-1111")).toBe(true);
  });

  it("does not flag a digit run that fails the Luhn check", () => {
    expect(containsSensitivePattern("Order number 1234 5678 9012 3456")).toBe(false);
  });
});

describe("evaluateThrottle", () => {
  it("allows under the cap and denies at or over it", () => {
    expect(evaluateThrottle({ recentCount: 0, maxPerWindow: 3 }).allowed).toBe(true);
    expect(evaluateThrottle({ recentCount: 2, maxPerWindow: 3 }).allowed).toBe(true);
    expect(evaluateThrottle({ recentCount: 3, maxPerWindow: 3 }).allowed).toBe(false);
    expect(evaluateThrottle({ recentCount: 9, maxPerWindow: 3 }).allowed).toBe(false);
  });
});

describe("windowStartIso", () => {
  it("subtracts the window from now", () => {
    expect(windowStartIso("2026-08-03T12:00:00.000Z", 60)).toBe("2026-08-03T11:00:00.000Z");
  });
});

describe("enforceAppointmentRateLimit", () => {
  const nowIso = "2026-08-03T12:00:00.000Z";

  it("allows when recent count is under the cap", async () => {
    const result = await enforceAppointmentRateLimit({
      phoneE164: "+14707814143",
      nowIso,
      maxPerWindow: 3,
      windowMinutes: 60,
      countRecent: async () => 1
    });
    expect(result.allowed).toBe(true);
    expect(result.recentCount).toBe(1);
  });

  it("denies when the recent count reaches the cap", async () => {
    let queriedSince = "";
    const result = await enforceAppointmentRateLimit({
      phoneE164: "+14707814143",
      nowIso,
      maxPerWindow: 3,
      windowMinutes: 60,
      countRecent: async ({ sinceIso }) => {
        queriedSince = sinceIso;
        return 3;
      }
    });
    expect(result.allowed).toBe(false);
    expect(queriedSince).toBe("2026-08-03T11:00:00.000Z");
  });
});
