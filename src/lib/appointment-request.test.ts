import { describe, expect, it } from "vitest";
import { validateAppointmentRequestPayload } from "./appointment-request";

describe("appointment request validation", () => {
  const validPayload = {
    bedrooms: 4,
    bathrooms: 2.5,
    preferredTime1: "2026-06-02T09:00",
    preferredTime2: "2026-06-03T10:00",
    preferredTime3: "2026-06-04T13:00"
  };

  it("accepts values inside the database appointment constraints", () => {
    expect(validateAppointmentRequestPayload(validPayload)).toMatchObject({
      ok: true,
      bedrooms: 4,
      bathrooms: 2.5
    });
  });

  it("rejects bathroom counts outside the database constraint before insert", () => {
    expect(validateAppointmentRequestPayload({ ...validPayload, bathrooms: 24 })).toEqual({
      ok: false,
      error: "Bathrooms must be between 1 and 6."
    });
  });

  it("rejects invalid preferred dates before converting to storage rows", () => {
    expect(validateAppointmentRequestPayload({ ...validPayload, preferredTime1: "not a date" })).toEqual({
      ok: false,
      error: "Preferred times must be valid dates."
    });
  });
});
