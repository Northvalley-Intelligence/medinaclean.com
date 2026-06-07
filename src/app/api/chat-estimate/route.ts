import { NextResponse } from "next/server";
import {
  buildFallbackChatResponse,
  buildOpenAiChatRequest,
  buildProviderHeaders,
  buildUsageEvent,
  getChatModelAttemptConfigs,
  normalizeChatEstimateRequest,
  parseOpenAiChatResponse,
  shouldRejectModelReply,
  shouldUseDeterministicPricing,
  type ChatEstimateResponse,
  type OpenAiUsage
} from "@/lib/llm-chat";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { buildChatNotificationText, trySendSiteNotification } from "@/lib/site-notifications";
import { insertServiceRow, isSupabaseServiceConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const chatRequest = normalizeChatEstimateRequest(body);
  if (!chatRequest) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const turnstile = await verifyTurnstileToken({
    token: chatRequest.turnstileToken,
    clientIp: request.headers.get("cf-connecting-ip") || "local"
  });
  if (!turnstile.ok) {
    return NextResponse.json({ error: "Please complete the verification and try again." }, { status: 403 });
  }

  const deterministic = buildFallbackChatResponse(chatRequest);
  const configs = getChatModelAttemptConfigs(process.env, chatRequest.turnIndex);
  if (configs.length === 0) {
    await notifyChat(chatRequest, deterministic);
    return NextResponse.json(deterministic);
  }

  for (const [index, config] of configs.entries()) {
    const startedAt = Date.now();
    try {
      const response = await fetch(config.baseUrl, {
        method: "POST",
        headers: buildProviderHeaders(config),
        body: JSON.stringify(buildOpenAiChatRequest(chatRequest.message, chatRequest.locale, config.model)),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`provider_${response.status}`);
      }

      const parsed = parseOpenAiChatResponse(await response.json());
      await logUsage(
        buildUsageEvent({
          config,
          usage: parsed.usage,
          latencyMs: Date.now() - startedAt,
          success: true,
          errorCode: null,
          fallbackUsed: index > 0
        })
      );

      const result = {
        reply:
          shouldUseDeterministicPricing(deterministic.reply) || shouldRejectModelReply(parsed.content)
            ? deterministic.reply
            : parsed.content,
        mode: "llm",
        provider: config.provider,
        model: config.model
      } as const;
      await notifyChat(chatRequest, result);
      return NextResponse.json(result);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message.slice(0, 80) : "provider_error";
      await logUsage(
        buildUsageEvent({
          config,
          usage: {} as OpenAiUsage,
          latencyMs: Date.now() - startedAt,
          success: false,
          errorCode,
          fallbackUsed: true
        })
      );
    }
  }

  await notifyChat(chatRequest, deterministic);
  return NextResponse.json(deterministic);
}

async function logUsage(event: ReturnType<typeof buildUsageEvent>) {
  if (!isSupabaseServiceConfigured()) {
    return;
  }

  try {
    await insertServiceRow("ai_usage_events", event);
  } catch (error) {
    console.error("AI usage logging failed", error);
  }
}

async function notifyChat(chatRequest: NonNullable<ReturnType<typeof normalizeChatEstimateRequest>>, result: ChatEstimateResponse) {
  await trySendSiteNotification({
    subject: `New Medina Clean chat: ${chatRequest.locale}`,
    text: buildChatNotificationText({
      locale: chatRequest.locale,
      message: chatRequest.message,
      turnIndex: chatRequest.turnIndex,
      reply: result.reply,
      mode: result.mode,
      provider: result.provider,
      model: result.model
    })
  });
}
