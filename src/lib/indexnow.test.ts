import { afterEach, describe, expect, it, vi } from "vitest";
import { buildIndexNowPayload, submitToIndexNow } from "./indexnow";

describe("buildIndexNowPayload", () => {
  it("defaults keyLocation to the host key file", () => {
    expect(buildIndexNowPayload(["https://medinaclean.com/en"], { key: "abc123", host: "medinaclean.com" })).toEqual({
      host: "medinaclean.com",
      key: "abc123",
      keyLocation: "https://medinaclean.com/abc123.txt",
      urlList: ["https://medinaclean.com/en"]
    });
  });
});

describe("submitToIndexNow", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is a no-op when no key is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await submitToIndexNow(["https://medinaclean.com/en"], {} as NodeJS.ProcessEnv);
    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is a no-op when there are no URLs", async () => {
    const result = await submitToIndexNow([], { INDEXNOW_KEY: "abc123" } as unknown as NodeJS.ProcessEnv);
    expect(result).toEqual({ ok: true, skipped: true });
  });

  it("posts the payload when a key is configured", async () => {
    const fetchMock = vi.fn(async () => Response.json({}, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await submitToIndexNow(["https://medinaclean.com/en"], {
      INDEXNOW_KEY: "abc123",
      INDEXNOW_HOST: "medinaclean.com"
    } as unknown as NodeJS.ProcessEnv);

    expect(result).toMatchObject({ ok: true, status: 200 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(JSON.parse(String(init.body))).toMatchObject({ key: "abc123", urlList: ["https://medinaclean.com/en"] });
  });
});
