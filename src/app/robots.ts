import type { MetadataRoute } from "next";

// GEN-001 TASK-014 — keep the site crawlable by search engines and explicitly welcome the AI
// answer/search agents (GEO signal) so Medina Clean stays discoverable in assistant answers.
// The agent-native booking endpoint is advertised separately in /llms.txt.
const aiAnswerAgents = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Google-Extended",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot"
];

// Endpoints/APIs are not indexable content (e.g. GET /mcp returns 405). Disallow them so search
// engines stop trying to index them and reporting 4xx "not indexed" noise. Does not affect the MCP
// server's use by assistants (that's a POST from the assistant runtime, not crawling).
const disallowedPaths = ["/api/", "/mcp"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: disallowedPaths },
      { userAgent: aiAnswerAgents, allow: "/", disallow: disallowedPaths }
    ],
    sitemap: "https://medinaclean.com/sitemap.xml",
    host: "https://medinaclean.com"
  };
}
