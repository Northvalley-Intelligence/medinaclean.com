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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: aiAnswerAgents, allow: "/" }
    ],
    sitemap: "https://medinaclean.com/sitemap.xml",
    host: "https://medinaclean.com"
  };
}
