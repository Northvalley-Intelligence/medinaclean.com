import { describe, expect, it } from "vitest";
import { extractZip, validateServiceArea, validateServiceAreaMessage } from "./service-area";

describe("service-area", () => {
  it("extracts the first 5-digit ZIP from address text", () => {
    expect(extractZip("Woodstock, GA 30188")).toBe("30188");
    expect(extractZip("no zip here")).toBe("");
  });

  it("accepts ZIP codes inside the current service area", () => {
    const result = validateServiceArea("30188");

    expect(result.ok).toBe(true);
    expect(result.distanceMiles).toBe(0);
    expect(result.message).toContain("within");
  });

  it("rejects unknown ZIP codes for manual review", () => {
    const result = validateServiceArea("99999");

    expect(result.ok).toBe(false);
    expect(result.distanceMiles).toBeNull();
    expect(result.message).toContain("manual");
  });

  it("returns localized service-area messages", () => {
    expect(validateServiceAreaMessage("30188", "es")).toEqual({
      ok: true,
      message: "Este ZIP está dentro del área de servicio actual."
    });
    expect(validateServiceAreaMessage("99999", "en")).toEqual({
      ok: false,
      message: "This ZIP appears outside the 20-mile service area. Rosa can review it manually."
    });
  });
});
