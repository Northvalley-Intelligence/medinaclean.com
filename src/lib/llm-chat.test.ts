import { describe, expect, it } from "vitest";
import {
  buildFallbackChatResponse,
  buildOpenAiChatRequest,
  buildProviderHeaders,
  buildUsageEvent,
  getChatModelAttemptConfigs,
  getChatModelConfig,
  normalizeChatEstimateRequest,
  parseOpenAiChatResponse,
  redactSensitiveText,
  shouldRejectModelReply,
  shouldUseDeterministicPricing
} from "./llm-chat";

describe("llm chat", () => {
  it("normalizes public chat requests without trusting extra fields", () => {
    expect(normalizeChatEstimateRequest({ message: "  3 bed 2 bath every 2 weeks  ", locale: "es", role: "admin" })).toEqual({
      message: "3 bed 2 bath every 2 weeks",
      locale: "es",
      turnIndex: 0,
      turnstileToken: ""
    });
  });

  it("normalizes a bounded hidden chat turn index", () => {
    expect(normalizeChatEstimateRequest({ message: "hello", turnIndex: 2 })).toMatchObject({ turnIndex: 2 });
    expect(normalizeChatEstimateRequest({ message: "hello", turnIndex: -1 })).toMatchObject({ turnIndex: 0 });
    expect(normalizeChatEstimateRequest({ message: "hello", turnIndex: 2000 })).toMatchObject({ turnIndex: 1000 });
  });

  it("uses deterministic pricing as the fallback", () => {
    const response = buildFallbackChatResponse({
      locale: "en",
      message: "I have 3 bedrooms and 2 bathrooms for every 2 weeks in 30188.",
      turnIndex: 0,
      turnstileToken: ""
    });

    expect(response.mode).toBe("deterministic_fallback");
    expect(response.reply).toContain("first cleaning $300");
    expect(response.reply).toContain("recurring $150");
    expect(response.reply).toContain("ZIP 30188 is inside");
    expect(response.reply).toContain("send Rosa your contact details");
    expect(response.reply).toContain("estimate PDF download button");
  });

  it("detects replies where deterministic pricing must override model math", () => {
    expect(shouldUseDeterministicPricing("Rough estimate: first cleaning $300; recurring $150.")).toBe(true);
    expect(shouldUseDeterministicPricing("Los Angeles, California is outside the service area.")).toBe(true);
    expect(shouldUseDeterministicPricing("Rosa brings standard cleaning materials.")).toBe(true);
    expect(shouldUseDeterministicPricing("I can answer cleaning material questions.")).toBe(false);
  });

  it("rejects unsupported material claims and fake URLs from model replies", () => {
    expect(shouldRejectModelReply("Rosa uses eco-friendly and non-toxic products. Visit https://example.com/booking-form")).toBe(true);
    expect(shouldRejectModelReply("We're based in [Your City/Region].")).toBe(true);
    expect(shouldRejectModelReply("Use the guided form below to send preferred times.")).toBe(false);
  });

  it("answers material questions from approved site facts", () => {
    const response = buildFallbackChatResponse({
      locale: "en",
      message: "What cleaning material does Rosa use?",
      turnIndex: 0,
      turnstileToken: ""
    });

    expect(response.reply).toBe(
      "Starting rates assume Rosa brings standard cleaning materials. If you want special products used, Rosa can review that request and the price may change."
    );
  });

  it("answers out-of-area city questions from approved service-area facts", () => {
    const response = buildFallbackChatResponse({
      locale: "en",
      message: "I am from los angels california, can you help?",
      turnIndex: 0,
      turnstileToken: ""
    });

    expect(response.reply).toContain("Woodstock, GA");
    expect(response.reply).toContain("outside the service area");
    expect(response.reply).not.toContain("[Your City/Region]");
  });

  it("redacts obvious contact details before provider calls", () => {
    expect(redactSensitiveText("Call me at 470-555-0111 or a@b.com at 100 Main Street")).toContain("[phone]");
    expect(redactSensitiveText("Call me at 470-555-0111 or a@b.com at 100 Main Street")).toContain("[email]");
    expect(redactSensitiveText("Call me at 470-555-0111 or a@b.com at 100 Main Street")).toContain("[street address]");
  });

  it("builds an OpenAI-compatible request with deterministic pricing rules", () => {
    const request = buildOpenAiChatRequest("3 bed 2 bath. 470-555-0111", "en", "llama3.1");

    expect(request.model).toBe("llama3.1");
    expect(request.messages[0].content).toContain("$30 per bedroom plus bathroom");
    expect(request.messages[1].content).toContain("[phone]");
  });

  it("reads free or local model configuration from environment", () => {
    expect(
      getChatModelConfig({
        AI_CHAT_ENABLED: "true",
        AI_CHAT_BASE_URL: "http://127.0.0.1:11434/v1/chat/completions",
        AI_CHAT_MODEL: "llama3.1",
        AI_CHAT_MODE: "local"
      } as unknown as NodeJS.ProcessEnv)
    ).toMatchObject({
      enabled: true,
      provider: "ollama",
      model: "llama3.1",
      mode: "local"
    });
  });

  it("infers OpenRouter config and adds attribution headers", () => {
    const longKey = `sk-or-v1-${"a".repeat(280)}`;
    const config = getChatModelConfig({
      AI_CHAT_ENABLED: "true",
      AI_CHAT_BASE_URL: "https://openrouter.ai/api/v1/chat/completions",
      AI_CHAT_MODEL: "liquid/lfm-2.5-1.2b-instruct:free",
      AI_CHAT_API_KEY: longKey,
      NEXT_PUBLIC_SITE_URL: "https://medinaclean.com"
    } as unknown as NodeJS.ProcessEnv);

    expect(config).toMatchObject({
      enabled: true,
      provider: "openrouter",
      mode: "free_api"
    });
    expect(buildProviderHeaders(config)).toMatchObject({
      authorization: `Bearer ${longKey}`,
      "HTTP-Referer": "https://medinaclean.com",
      "X-Title": "Medina Clean"
    });
  });

  it("uses a provider-specific OpenRouter key when the generic chat key is unset", () => {
    const openRouterKey = `sk-or-v1-${"b".repeat(280)}`;
    const config = getChatModelConfig({
      AI_CHAT_ENABLED: "true",
      AI_CHAT_PROVIDER: "openrouter",
      AI_CHAT_BASE_URL: "https://openrouter.ai/api/v1/chat/completions",
      AI_CHAT_MODEL: "liquid/lfm-2.5-1.2b-instruct:free",
      OPENROUTER_API_KEY: openRouterKey
    } as unknown as NodeJS.ProcessEnv);

    expect(config.apiKey).toBe(openRouterKey);
    expect(buildProviderHeaders(config).authorization).toBe(`Bearer ${openRouterKey}`);
  });

  it("rotates Gemini and OpenRouter provider order by browser session turn", () => {
    const env = {
      AI_CHAT_ENABLED: "true",
      AI_CHAT_PROVIDER_CHAIN: "gemini,openrouter",
      AI_CHAT_MODE: "free_api",
      GEMINI_API_KEY: "gemini-key",
      GEMINI_MODEL: "gemini-2.5-flash",
      OPENROUTER_API_KEY: `sk-or-v1-${"c".repeat(280)}`,
      OPENROUTER_MODEL: "liquid/lfm-2.5-1.2b-instruct:free",
      NEXT_PUBLIC_SITE_URL: "https://medinaclean.com"
    } as unknown as NodeJS.ProcessEnv;

    expect(getChatModelAttemptConfigs(env, 0).map((config) => config.provider)).toEqual(["gemini", "openrouter"]);
    expect(getChatModelAttemptConfigs(env, 1).map((config) => config.provider)).toEqual(["openrouter", "gemini"]);
    expect(getChatModelAttemptConfigs(env, 2).map((config) => config.provider)).toEqual(["gemini", "openrouter"]);
    expect(getChatModelAttemptConfigs(env, 0)[0]).toMatchObject({
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      model: "gemini-2.5-flash",
      apiKey: "gemini-key"
    });
  });

  it("parses OpenAI-compatible responses and usage metadata", () => {
    expect(
      parseOpenAiChatResponse({
        choices: [{ message: { content: "Use the guided estimator below." } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 }
      })
    ).toEqual({
      content: "Use the guided estimator below.",
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    });
  });

  it("builds usage events without storing conversation text", () => {
    const event = buildUsageEvent({
      config: getChatModelConfig({
        AI_CHAT_ENABLED: "true",
        AI_CHAT_PROVIDER: "groq",
        AI_CHAT_MODEL: "llama",
        AI_CHAT_BASE_URL: "https://example.com/v1/chat/completions"
      } as unknown as NodeJS.ProcessEnv),
      usage: { prompt_tokens: 10, completion_tokens: 5, prompt_tokens_details: { cached_tokens: 2 } },
      latencyMs: 123,
      success: true,
      errorCode: null,
      fallbackUsed: false
    });

    expect(event).toMatchObject({
      feature: "website_chat",
      request_type: "client_chat",
      input_tokens: 10,
      output_tokens: 5,
      cached_input_tokens: 2,
      estimated_cost_usd: 0
    });
    expect(JSON.stringify(event)).not.toContain("3 bed");
  });
});
