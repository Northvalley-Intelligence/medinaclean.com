import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it } from "vitest";
import { buildMcpServer } from "./mcp-server";

async function connectedClient() {
  const server = buildMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

function parse(result: { content: Array<{ type: string; text?: string }> }) {
  return JSON.parse(result.content[0].text ?? "{}");
}

describe("buildMcpServer", () => {
  let client: Client;

  beforeEach(async () => {
    client = await connectedClient();
  });

  it("exposes the five agent-native tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "check_service_area",
      "get_estimate",
      "get_pricing_rules",
      "list_services",
      "request_appointment"
    ]);
  });

  it("get_estimate returns the deterministic starting price", async () => {
    const result = await client.callTool({
      name: "get_estimate",
      arguments: { bedrooms: 3, bathrooms: 2, frequency: "triweekly" }
    });
    expect(parse(result as never)).toMatchObject({ estimate: 200, currency: "USD" });
  });

  it("check_service_area gates the home ZIP", async () => {
    const result = await client.callTool({ name: "check_service_area", arguments: { zip: "30188" } });
    expect(parse(result as never)).toMatchObject({ eligible: true, zip: "30188" });
  });

  it("request_appointment never confirms: an out-of-area request is rejected, not booked", async () => {
    const result = await client.callTool({
      name: "request_appointment",
      arguments: {
        name: "Taylor Client",
        phone: "(470) 555-0111",
        address: "1 Nowhere Rd",
        zip: "99999",
        service_type: "Every 2 weeks",
        bedrooms: 3,
        bathrooms: 2,
        preferred_times: ["2026-08-10T09:00"]
      }
    });
    const parsed = parse(result as never);
    expect(parsed.ok).toBe(false);
    expect(parsed.reason).toBe("out_of_area");
    expect(parsed.status).not.toBe("confirmed");
  });
});
