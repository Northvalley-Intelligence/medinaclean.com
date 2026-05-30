import { describe, expect, it } from "vitest";
import { normalizeUsPhone } from "./phone";

describe("phone", () => {
  it("accepts any formatted 10-digit phone number", () => {
    expect(normalizeUsPhone("112-233-4566")).toEqual({
      e164: "+11122334566",
      display: "(112) 233-4566"
    });
  });

  it("rejects values that do not contain exactly 10 national digits", () => {
    expect(normalizeUsPhone("555")).toBeNull();
  });
});
