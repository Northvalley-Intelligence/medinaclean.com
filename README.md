# Medina Clean

Bilingual, zero-monthly-cost-first website for Rosa Medina's cleaning services in the Woodstock, GA area.

Built by Northvalley Intelligence LLC: https://northvalleyintel.com

For similar projects: contact@northvalleyintel.com

## Stack

- Next.js
- Supabase Free for appointment requests, moderated reviews, referrals, and low-resolution review headshots
- Cloudflare Workers deployment through OpenNext
- No paid Google Maps dependency
- Local ZIP-radius validation against the 30188 service center

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` after creating a Supabase Free project.

For isolated local database and browser integration testing, see `docs/local-testing.md`.

Useful test commands:

```bash
npm run test:coverage
npm run test:e2e
npm run test:e2e:db
```

## GitHub Governance

See `docs/github-governance.md` for the PR-gate, CI, Dependabot, and branch-protection plan. Branch protection/rulesets require a GitHub plan that supports private-repo enforcement or a public repository.

## Cost Controls

- The app does not require paid APIs.
- Address eligibility uses a local ZIP centroid check within 20 miles of `30188`.
- Supabase API routes return a configuration error instead of writing data when Supabase env vars are missing.
- Review photos are resized client-side before upload and rejected server-side when too large.

## Website Chat LLM Flow

The public chat assistant can use hosted or local OpenAI-compatible chat providers, but pricing, service-area checks, material claims, and appointment submission stay guarded by deterministic application code.

```mermaid
flowchart TD
  A[Customer uses website chat] --> B[POST /api/chat-estimate]
  B --> C[Normalize message, locale, and hidden browser turn index]
  C --> D[Build deterministic Medina Clean fallback answer]
  C --> E{AI chat enabled?}
  E -- No --> D
  E -- Yes --> F[Choose provider order from AI_CHAT_PROVIDER_CHAIN]
  F --> G{Turn index}
  G -- Even --> H[Try Gemini Flash first]
  G -- Odd --> I[Try OpenRouter first]
  H --> J[Fallback provider: OpenRouter]
  I --> K[Fallback provider: Gemini Flash]
  J --> L{Provider reply ok?}
  K --> L
  L -- No, timeout, quota, or error --> D
  L -- Yes --> M[Reject unsafe or invented claims]
  M --> N{Reply touches controlled facts?}
  N -- Pricing, service area, materials, booking --> D
  N -- General answer --> O[Return LLM answer]
  D --> P[Return deterministic answer]
  O --> Q[Log AI usage metadata only]
  P --> Q

  subgraph Supported providers
    R[Gemini Flash direct]
    S[OpenRouter free/paid models]
    T[OpenAI API models]
    U[Local Llama through Ollama or OpenAI-compatible server]
  end
```

Current production configuration alternates Gemini and OpenRouter by browser-session turn while keeping deterministic rules as the final fallback. OpenAI and local Llama/Ollama can be used by setting the OpenAI-compatible base URL, model, and API key in the same provider configuration pattern. See `docs/ai-usage-and-local-llm.md`.

## Deployment

Deployments are configured through GitHub Actions to Cloudflare Workers. Do not add billing unless explicitly approved.

```bash
npm run cf:build
npm run cf:preview
```

## Supabase Setup

1. Create one Supabase project for Rosa only.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create a private storage bucket named `review-headshots`.
4. Add environment variables from `.env.example` to the host.

The schema enables Row Level Security on every public table. After running it, verify that RLS is enabled for:

- `appointment_requests`
- `reviews`
- `referrals`

Public users can submit appointments and reviews. They cannot read private appointment submissions. Reviews only appear after Rosa approves them.
