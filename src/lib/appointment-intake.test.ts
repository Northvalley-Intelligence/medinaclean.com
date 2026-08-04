import { describe, expect, it } from "vitest";
import { prepareAppointmentIntake } from "./appointment-intake";

const validBody = {
  language: "en",
  name: "Taylor Client",
  phone: "+14705550111",
  address: "100 Main Street, Woodstock, GA",
  zipCode: "30188",
  serviceType: "Every 2 weeks",
  bedrooms: 3,
  bathrooms: 2,
  preferredTime1: "2026-06-10T09:00",
  preferredTime2: "2026-06-11T10:00",
  preferredTime3: "2026-06-12T11:00",
  notes: "Has a dog"
};

describe("prepareAppointmentIntake", () => {
  it("builds a normalized row for a valid in-area request", () => {
    const result = prepareAppointmentIntake(validBody);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toMatchObject({
      language: "en",
      name: "Taylor Client",
      zip_code: "30188",
      bedrooms: 3,
      bathrooms: 2,
      source: "website"
    });
    expect(result.row.distance_miles).not.toBeNull();
  });

  it("defaults language to en and records the mcp_assistant source", () => {
    const result = prepareAppointmentIntake({ ...validBody, language: "es", source: "mcp_assistant" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.language).toBe("es");
    expect(result.row.source).toBe("mcp_assistant");
  });

  it("rejects an out-of-area ZIP with a 400", () => {
    const result = prepareAppointmentIntake({ ...validBody, zipCode: "99999" });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects missing required fields with a 400", () => {
    const result = prepareAppointmentIntake({ ...validBody, name: "" });
    expect(result).toMatchObject({ ok: false, status: 400, error: "Missing name." });
  });

  it("rejects an invalid bedroom count with a 400", () => {
    const result = prepareAppointmentIntake({ ...validBody, bedrooms: 0 });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("falls back to a ZIP extracted from the address", () => {
    const result = prepareAppointmentIntake({ ...validBody, zipCode: "", address: "5 Oak Rd, Woodstock GA 30189" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.zip_code).toBe("30189");
  });
});
