import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

function initializeRequest() {
  return new Request("https://mcp.medinaclean.com/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" }
      }
    })
  });
}

describe("/mcp route", () => {
  it("handles an MCP initialize over the web-standard transport and returns server info", async () => {
    const response = await POST(initializeRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

    const text = await response.text();
    // enableJsonResponse returns JSON; some clients frame it as an SSE event — handle both.
    const jsonPart = text.includes("data:") ? text.split("data:")[1].trim() : text;
    const payload = JSON.parse(jsonPart);
    expect(payload.result.serverInfo.name).toBe("medina-clean");
    expect(payload.result.protocolVersion).toBeTruthy();
  });

  it("rejects GET with 405", () => {
    const response = GET();
    expect(response.status).toBe(405);
  });
});
