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

  it("annotates read tools read-only and the write tool as not read-only (directory requirement)", async () => {
    const { tools } = await client.listTools();
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    for (const name of ["check_service_area", "list_services", "get_pricing_rules", "get_estimate"]) {
      expect(byName[name].annotations).toMatchObject({
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false
      });
    }
    expect(byName["request_appointment"].annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true
    });
  });

  it("get_estimate returns the deterministic starting price", async () => {
    const result = await client.callTool({
      name: "get_estimate",
      arguments: { bedrooms: 3, bathrooms: 2, frequency: "triweekly" }
    });
    expect(parse(result as never)).toMatchObject({ estimate: 200, currency: "USD" });
  });

  it("registers the inline UI templates as resources (TASK-011)", async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("ui://medina-clean/estimate-card");
    expect(uris).toContain("ui://medina-clean/appointment-request");
  });

  it("get_estimate carries structuredContent and an output-template for the inline card", async () => {
    const { tools } = await client.listTools();
    const estimateTool = tools.find((t) => t.name === "get_estimate");
    expect(estimateTool?._meta?.["openai/outputTemplate"]).toBe("ui://medina-clean/estimate-card");

    const result = (await client.callTool({
      name: "get_estimate",
      arguments: { bedrooms: 3, bathrooms: 2, frequency: "biweekly" }
    })) as { structuredContent?: Record<string, unknown> };
    expect(result.structuredContent).toMatchObject({ estimate: 150, language: "en" });
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

  // OpenAI resubmission findings (2026-08-22): don't solicit more than necessary, and don't echo
  // submitted PII back in tool responses. Uses the same out-of-area ZIP as the test above so the
  // call rejects before touching Supabase (the reviews-summary incident, ccbd8a1, showed CI
  // injects real prod Supabase env into these test steps — never exercise persist/countRecent here).
  it("request_appointment's public schema has no secret field", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "request_appointment");
    const schemaKeys = Object.keys(tool?.inputSchema?.properties ?? {});
    expect(schemaKeys).not.toContain("secret");
    expect(schemaKeys.sort()).toEqual(
      [
        "address",
        "bathrooms",
        "bedrooms",
        "honeypot",
        "language",
        "name",
        "notes",
        "phone",
        "preferred_times",
        "service_type",
        "zip"
      ].sort()
    );
  });

  it("request_appointment's notes description instructs against sensitive information", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "request_appointment");
    const notesSchema = (tool?.inputSchema?.properties as Record<string, { description?: string }>)?.notes;
    expect(notesSchema?.description).toMatch(/health|payment|ID|sensitive/i);
  });

  it("request_appointment's tool description discloses why PII is collected", async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "request_appointment");
    expect(tool?.description).toMatch(/privacy/i);
  });

  it("request_appointment does not echo submitted PII in a rejected response", async () => {
    const result = await client.callTool({
      name: "request_appointment",
      arguments: {
        name: "Taylor Client",
        phone: "(470) 555-0111",
        address: "1 Nowhere Rd, Unusual Landmark",
        zip: "99999",
        service_type: "Every 2 weeks",
        bedrooms: 3,
        bathrooms: 2,
        preferred_times: ["2026-08-10T09:00"],
        notes: "Has a very friendly dog"
      }
    });
    const parsed = parse(result as never);
    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain("Taylor Client");
    expect(serialized).not.toContain("555-0111");
    expect(serialized).not.toContain("Unusual Landmark");
    expect(serialized).not.toContain("friendly dog");
  });
});
