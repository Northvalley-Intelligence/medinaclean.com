# AI Usage And Local LLM Evaluation

Rosa's operations app must work with a zero-dollar AI budget. AI features are enhancements, not hard dependencies.

## Tracking Requirement

Every server-side AI request must write one row to `public.ai_usage_events`, including failed calls. This applies to free API calls, paid API calls used during testing, and local model calls.

Required fields:

- `feature`: user-facing feature, such as `website_chat`, `admin_reply_helper`, or `quote_helper`
- `provider`: `gemini`, `cloudflare_workers_ai`, `groq`, `openai`, `ollama`, or another explicit provider name
- `model`: exact model identifier used
- `mode`: `free_api`, `paid_api`, or `local`
- `request_type`: one of the allowed request categories in `supabase/schema.sql`
- `input_tokens`, `output_tokens`, and `cached_input_tokens`
- `estimated_cost_usd`: `0` for truly free quota or local tests, otherwise the best estimate at call time
- `latency_ms`
- `success` and `error_code`

Do not store full client conversations in this table. Store private lead, client, or conversation data in their own protected tables, then reference IDs from usage rows.

## Monthly Review

Use the `public.ai_usage_monthly_summary` view to compare:

- total requests by feature
- free API failures or quota errors
- latency by provider/model
- estimated paid cost if the same usage moved off a free tier
- which features are actually producing leads or appointments

AI is worth expanding only when it improves a business metric:

- more qualified leads
- faster first response
- more booked first cleanings
- more recurring clients
- lower manual translation burden for Rosa

## Local LLM Evaluation

Do not assume local hosting is cheaper. Compare it against free and low-cost hosted APIs using measured traffic.

Evaluate local LLM hosting only after at least 30 days of usage data or after the free tier blocks normal use.

Decision factors:

- Hardware already available: can an existing Mac mini, desktop, or spare machine run the model reliably?
- Electricity and maintenance: local is not zero-cost if it needs a dedicated always-on machine.
- Uptime: website chat cannot depend on a laptop that may be asleep or offline.
- Latency: client-facing chat should feel fast enough to keep the lead engaged.
- Quality: bilingual English/Spanish replies must be good enough for real customers.
- Privacy: local can reduce third-party exposure, but operational security still matters.
- Complexity: tunnels, dynamic DNS, monitoring, updates, backups, and restarts all count as cost.

## Recommended Path

1. Start with rules-based lead capture and templates, which cost `$0`.
2. Add free-tier AI only for low-risk tasks: public chat assistance, translation, summaries, and reply drafts.
3. Track every AI call in `ai_usage_events`.
4. Keep a template fallback for every AI feature.
5. Revisit local LLM hosting only when measured usage shows a recurring cost or reliability problem.

## Provider Switching

The public website chat uses OpenAI-compatible chat completions behind environment variables. Pricing, service-area answers, material claims, and lead capture remain deterministic in application code, so weaker or free models can be tried without trusting them for business rules.

For browser sessions, the app rotates the primary provider invisibly by turn number. With `AI_CHAT_PROVIDER_CHAIN=gemini,openrouter`, the first message tries Gemini first, the second tries OpenRouter first, and later messages continue alternating. If the selected provider fails, the API tries the next configured provider before returning the deterministic rules fallback.

Local Ollama example:

```bash
AI_CHAT_ENABLED=true
AI_CHAT_PROVIDER=ollama
AI_CHAT_MODE=local
AI_CHAT_BASE_URL=http://127.0.0.1:11434/v1/chat/completions
AI_CHAT_MODEL=llama3.1:8b
```

OpenRouter free-model example:

```bash
AI_CHAT_ENABLED=true
AI_CHAT_PROVIDER_CHAIN=gemini,openrouter
AI_CHAT_MODE=free_api
GEMINI_API_KEY=<gemini-key>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
OPENROUTER_API_KEY=<openrouter-key>
OPENROUTER_MODEL=liquid/lfm-2.5-1.2b-instruct:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
AI_CHAT_APP_URL=https://medinaclean.com
AI_CHAT_APP_TITLE=Medina Clean
```

OpenRouter free models and provider routing are best-effort, not a production SLA. Keep deterministic fallback and local Ollama available when quota, model availability, or latency are poor.

## Local LLM Test Criteria

A local model is worth considering if it can meet all of these:

- `$0` incremental hosting cost using hardware already owned
- median response under 5 seconds for short replies
- Spanish-to-English and English-to-Spanish quality acceptable to Rosa
- no public endpoint exposed without authentication
- automatic restart after failure
- clear fallback to templates or free API when unavailable

Until those are true, hosted free-tier AI plus strict fallbacks is the lower-risk option.
