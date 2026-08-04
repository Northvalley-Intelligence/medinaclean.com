import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildMcpServer } from "@/lib/mcp-server";

// GEN-001 TASK-007 — public, HTTPS-only MCP endpoint for the agent-native booking lane.
// Stateless: a fresh server + web-standard transport per request (serverless-friendly on
// Cloudflare Workers/OpenNext). JSON responses (no long-lived SSE) keep it Workers-safe.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, authorization",
  "Access-Control-Max-Age": "86400"
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function POST(request: Request): Promise<Response> {
  const server = buildMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return withCors(response);
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

export function GET(): Response {
  return withCors(
    new Response(JSON.stringify({ error: "Method not allowed. POST JSON-RPC to this MCP endpoint." }), {
      status: 405,
      headers: { "content-type": "application/json" }
    })
  );
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
