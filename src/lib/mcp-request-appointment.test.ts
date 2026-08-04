import { describe, expect, it, vi } from "vitest";
import { requestAppointment } from "./mcp-request-appointment";
import type { AppointmentRow } from "./appointment-intake";

const baseInput = {
  name: "Taylor Client",
  phone: "(470) 555-0111",
  address: "100 Main Street, Woodstock, GA",
  zip: "30188",
  service_type: "Every 2 weeks",
  bedrooms: 3,
  bathrooms: 2,
  preferred_times: ["2026-08-10T09:00", "2026-08-11T10:00", "2026-08-12T11:00"],
  notes: "Has a dog",
  language: "en" as const
};

function deps(overrides: Partial<Parameters<typeof requestAppointment>[1]> = {}) {
  const persisted: AppointmentRow[] = [];
  const persist = vi.fn(async (row: AppointmentRow) => {
    persisted.push(row);
    return { id: "req-1" };
  });
  return {
    persisted,
    persist,
    d: {
      now: () => "2026-08-03T12:00:00.000Z",
      countRecent: async () => 0,
      persist,
      sharedSecretExpected: "",
      ...overrides
    }
  };
}

describe("requestAppointment — success (BDD-011)", () => {
  it("stores a pending request via the shared intake and reports pending_review, never confirmed", async () => {
    const { d, persist, persisted } = deps();
    const result = await requestAppointment(baseInput, d);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe("pending_review");
    expect(result.request_id).toBe("req-1");
    expect(result.message).toMatch(/does not confirm|will review/i);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persisted[0].source).toBe("mcp_assistant");
    // Trust invariant: the row carries no accepted/confirmed status; schema default 'pending' applies.
    expect(persisted[0]).not.toHaveProperty("status");
  });

  it("returns a Spanish confirmation when language is es", async () => {
    const { d } = deps();
    const result = await requestAppointment({ ...baseInput, language: "es" }, d);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message).toMatch(/Rosa/);
    expect(result.message).toMatch(/no confirma|revisar/i);
  });
});

describe("requestAppointment — abuse & validation gates", () => {
  it("rejects when the honeypot is filled and never persists", async () => {
    const { d, persist } = deps();
    const result = await requestAppointment({ ...baseInput, honeypot: "http://spam" }, d);
    expect(result).toMatchObject({ ok: false, reason: "honeypot" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("rejects an invalid shared secret with 401", async () => {
    const { d, persist } = deps({ sharedSecretExpected: "s3cret" });
    const result = await requestAppointment({ ...baseInput, secret: "wrong" }, d);
    expect(result).toMatchObject({ ok: false, reason: "invalid_secret", status: 401 });
    expect(persist).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone", async () => {
    const { d, persist } = deps();
    const result = await requestAppointment({ ...baseInput, phone: "123" }, d);
    expect(result).toMatchObject({ ok: false, reason: "invalid_phone" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("rejects an out-of-area ZIP with a bilingual message", async () => {
    const { d, persist } = deps();
    const result = await requestAppointment({ ...baseInput, zip: "99999", language: "es" }, d);
    expect(result).toMatchObject({ ok: false, reason: "out_of_area" });
    if (result.ok) return;
    expect(result.message).toMatch(/Rosa/);
    expect(persist).not.toHaveBeenCalled();
  });

  it("throttles when too many recent requests exist for the phone (429)", async () => {
    const { d, persist } = deps({ countRecent: async () => 3 });
    const result = await requestAppointment(baseInput, d);
    expect(result).toMatchObject({ ok: false, reason: "rate_limited", status: 429 });
    expect(persist).not.toHaveBeenCalled();
  });

  it("stores the phone in E.164 so the throttle key is consistent", async () => {
    const { d, persisted } = deps();
    await requestAppointment(baseInput, d);
    expect(persisted[0].phone).toBe("+14705550111");
  });
});
