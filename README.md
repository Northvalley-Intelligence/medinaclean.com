# Medina Clean

Bilingual, zero-subscription-fee-first website and lightweight operations app for Rosa Medina's cleaning services in the Woodstock, GA area.

Built by Northvalley Intelligence LLC: https://northvalleyintel.com


## Project Thesis

Medina Clean was designed around one hard constraint: the business should not need recurring software subscription fees to run the public website or the first version of the admin workflow.

That constraint shaped the architecture:

- Hosting runs on Cloudflare Workers through OpenNext.
- Data storage uses Supabase Free.
- Address eligibility uses local ZIP centroid validation instead of paid maps APIs.
- Public SEO uses crawlable content, sitemap, robots, canonical URLs, local service pages, and JSON-LD instead of paid discovery tools.
- The admin app uses first-party server routes and Supabase tables instead of paid CRM, booking, review, or field-service software.
- AI features are optional and guarded by deterministic application logic, with usage logging so cost can be reviewed before any paid provider decision.

## Article Outline

This project can be written as a two-part article.

Part 1: Public Website

- Building a bilingual local-service website for a small cleaning business.
- Keeping the first viewport clear: cleaning services, service area, and appointment request.
- Local SEO for Woodstock, GA and nearby cities using crawlable service pages.
- Structured data for `CleaningService`, `LocalBusiness`, service offers, FAQs, and local service pages.
- Free service-area validation using ZIP data instead of Google Maps billing.
- Privacy-safe lead capture, review submission, and moderated public reviews.
- Optional chat estimates with deterministic guardrails.

Part 2: Admin UI

- Turning the same Next.js app into Rosa's private operations workspace.
- Spanish-first admin screens with English available.
- Protecting private routes with server-side authentication.
- Managing clients, jobs, crew availability, reviews, videos, ads planning, and follow-up tasks.
- Using Supabase Row Level Security and service-role-only admin writes.
- Preserving the $0 subscription principle while leaving room for future paid services only when the business approves them.

## Zero-Subscription Design Principles

The guiding rule is not "never pay for software." The rule is: do not require paid subscriptions before the business has enough volume to justify them.

Practical decisions:

- No paid Google Maps dependency.
- No Twilio/SMS dependency for launch.
- No paid email provider required for launch.
- No paid CRM, booking, or review platform.
- No paid analytics requirement.
- No paid media storage requirement for basic review photos.
- No automatic production dependency on a paid AI model.

The tradeoff is that some workflows are intentionally simple:

- Rosa manually confirms exact address availability after the ZIP check.
- Appointment requests are requests, not instant confirmed bookings.
- Google Business Profile and Search Console still need external setup because Google local-pack visibility cannot be solved only with website code.
- AI answers are constrained and can fall back to deterministic copy instead of inventing prices or service-area claims.

## Stack

- Next.js App Router
- TypeScript
- Supabase Free for appointment requests, moderated reviews, referrals, clients, jobs, crew data, AI usage metadata, and public video records
- Cloudflare Workers deployment through OpenNext
- GitHub Actions for CI and main-branch production deploys
- Playwright for browser-visible workflows
- Vitest for business rules and backend helpers
- Local ZIP-radius validation against the 30188 service center

## High-Level Architecture

```mermaid
flowchart LR
  subgraph Users
    C[Cleaning customer]
    R[Rosa / admin user]
  end

  subgraph Edge["Cloudflare edge"]
    DNS[Cloudflare DNS]
    W[Cloudflare Worker]
    N[Next.js App Router via OpenNext]
  end

  subgraph App["Application layers"]
    P[Public bilingual website]
    A[Private admin UI]
    API[Route handlers]
    LIB[Shared business logic in src/lib]
  end

  subgraph Data["Free-first data layer"]
    SB[(Supabase Free Postgres)]
    ST[(Private Supabase Storage)]
  end

  subgraph External["Optional or external systems"]
    YT[YouTube for public project videos]
    GA[GA4 / GTM]
    GBP[Google Business Profile]
    GSC[Google Search Console]
    AI[Optional AI providers]
  end

  C --> DNS --> W --> N --> P
  R --> DNS --> W --> N --> A
  P --> API
  A --> API
  API --> LIB
  API --> SB
  API --> ST
  API --> YT
  API --> AI
  P --> GA
  GBP -. local-pack visibility .-> C
  GSC -. indexing feedback .-> P
```

## Public Website

The public side is built for local discovery and trust without requiring paid tools.

Core public pages and features:

- `/en` and `/es` bilingual home pages.
- Dedicated local service pages, such as `/en/house-cleaning-woodstock-ga`.
- Dedicated nearby-city pages for Marietta, Kennesaw, Acworth, Canton, and Roswell coverage.
- Appointment request form with server validation.
- Review submission with moderation before publishing.
- Optional review headshot upload, resized client-side and stored privately.
- Before-and-after video section backed by admin-managed YouTube links.
- Guided chat estimate with deterministic fallbacks.
- `robots.txt`, `sitemap.xml`, canonical URLs, and bilingual alternates.

### Public Website Flow

```mermaid
flowchart TD
  A[Customer searches for cleaning service] --> B{Discovery path}
  B --> C[Google organic result]
  B --> D[Google Business Profile local result]
  B --> E[Direct or social link]

  C --> F[Public Medina Clean page]
  D --> F
  E --> F

  F --> G[Customer reads services, pricing guide, FAQs, reviews]
  G --> H{Customer action}
  H --> I[Request appointment]
  H --> J[Ask guided chat estimate]
  H --> K[Leave review]
  H --> L[Call the public phone number]

  I --> M[Server validates name, phone, address, ZIP, service details, times]
  M --> N[(Supabase appointment_requests)]
  N --> O[Rosa reviews privately]

  J --> P[Deterministic rules check pricing and service area]
  P --> Q{AI enabled?}
  Q -- No --> R[Return deterministic answer]
  Q -- Yes --> S[Try configured provider]
  S --> T[Reject unsupported claims]
  T --> R

  K --> U[Store pending review]
  U --> V[Rosa approves or rejects]
  V --> W[Approved review appears publicly]
```

### Local SEO Surface

The website gives search engines stable local signals:

- Business name: `Medina Clean`.
- Service types: house cleaning, apartment cleaning, condo cleaning, deep cleaning, recurring cleaning, small business cleaning.
- Service area: Woodstock, GA, ZIP `30188`, and nearby Georgia communities.
- Service pages with human-readable copy and FAQs.
- Canonical URLs and `hreflang` alternates.
- Structured data for the home page and local service pages.
- Permanent redirects for legacy indexed URLs.

### What Website Code Cannot Do

The website can improve organic discovery, but the Google "business tab" and map/local-pack behavior depends mostly on external Google configuration:

- Google Business Profile must be created, verified, and kept accurate.
- Search Console should verify `medinaclean.com` and submit `https://medinaclean.com/sitemap.xml`.
- Real customer reviews on Google Business Profile matter for local pack trust.
- Photos, services, hours, service area, phone, and appointment URL should be maintained inside Google Business Profile.

## Admin UI

The admin side is Rosa's private operations workspace inside the same app. It avoids a paid CRM or booking product while keeping private data off the public site.

Admin priorities:

- Spanish-first interface for Rosa.
- English option for testing and support.
- Server-side admin authentication.
- Private data access only through backend routes.
- Shared validation and scheduling helpers in `src/lib`.
- Thin API routes: authenticate, parse, call helpers, persist, respond.

Current admin areas:

- Dashboard and attention tasks.
- Client onboarding and client detail pages.
- Job scheduling and recurring job planning.
- Crew members and crew unavailability.
- Calendar and blocked time.
- Review approval.
- Public video upload and visibility management.
- Ads planning workspace with draft/tracking-link generation.
- Meta Ads readiness checks for account, page, and optional Instagram connection.

### Admin Request Flow

```mermaid
flowchart TD
  A[Rosa opens /admin] --> B{Has valid admin session?}
  B -- No --> C[Login form]
  C --> D[POST /api/admin/login]
  D --> E[Validate password server-side]
  E --> F[Set signed admin session cookie]
  F --> G[Admin dashboard]

  B -- Yes --> G
  G --> H{Admin workflow}
  H --> I[Clients]
  H --> J[Jobs and recurring schedules]
  H --> K[Crew availability]
  H --> L[Review approval]
  H --> M[Videos]
  H --> N[Ads planning]

  I --> O[Admin API route]
  J --> O
  K --> O
  L --> O
  M --> O
  N --> O

  O --> P[Authenticate request]
  P --> Q[Parse and validate payload]
  Q --> R[Call shared src/lib helper]
  R --> S[(Supabase via service role)]
  S --> T[Return JSON or redirect back to admin UI]
```

### Admin Scheduling Flow

```mermaid
flowchart TD
  A[Rosa creates or updates a client] --> B[Client record stores preferred frequency and time]
  B --> C[Rosa schedules a job]
  C --> D[Validate job payload]
  D --> E[Load active crew, existing jobs, and unavailability]
  E --> F{Manual crew selected?}
  F -- Yes --> G[Check selected crew availability and conflicts]
  F -- No --> H[Choose available crew member with fewest active allocations]
  G --> I{Available?}
  H --> I
  I -- No --> J[Return conflict message]
  I -- Yes --> K[Insert job]
  K --> L[Show updated client or calendar view]

  B --> M[Recurring job planner]
  M --> N[Find next preferred recurring slot]
  N --> O[Respect crew availability, time blocks, and existing jobs]
  O --> K
```

### Meta Ads Readiness Flow

The admin ads workspace is designed to prepare campaigns without accidentally spending money.

Meta live publishing remains disabled unless all of these are true:

- `META_ADS_LIVE_ENABLED=true`
- `META_ACCESS_TOKEN` is configured.
- `META_AD_ACCOUNT_ID` is configured.
- `META_PAGE_ID` is configured.
- Optional `META_INSTAGRAM_ACTOR_ID` is configured when Instagram placement needs a specific actor.
- The Meta app, ad account, page permissions, and billing setup are ready in Meta Business Manager.

The backend can inspect whether the configured ad account and page are reachable. If live publishing is unavailable, the admin UI still produces draft campaign details and tracked chat links.

```mermaid
flowchart TD
  A[Rosa opens admin ads planner] --> B[GET /api/admin/ads]
  B --> C{Meta config complete?}
  C -- No --> D[Show missing configuration]
  C -- Yes --> E[Call Meta Graph API]
  E --> F{Account and page reachable?}
  F -- No --> G[Show connection error]
  F -- Yes --> H[Show account, currency, page, and Instagram status]

  A --> I[Generate ad plan]
  I --> J[Build ZIP-targeted campaign draft]
  J --> K[Create tracked chat landing link]
  K --> L{Publish mode}
  L -- Dry run --> M[Return draft only]
  L -- Publish paused --> N{Live enabled and credentials valid?}
  N -- No --> O[Reject publish request]
  N -- Yes --> P[Create Meta campaign, ad set, creative, and ad as PAUSED]
  P --> Q[Rosa reviews in Meta before activating]
```

## Data Model

```mermaid
erDiagram
  appointment_requests {
    uuid id
    text name
    text phone
    text address
    text zip
    text service_type
    text status
    timestamptz created_at
  }

  reviews {
    uuid id
    text name
    int rating
    text message
    text status
    boolean consent_to_publish
    text photo_path
  }

  referrals {
    uuid id
    text referrer_name
    text referred_name
    text status
  }

  clients {
    uuid id
    text name
    text phone
    text address
    text status
    text recurring_frequency
  }

  jobs {
    uuid id
    uuid client_id
    uuid crew_member_id
    timestamptz scheduled_for
    text status
    int duration_minutes
  }

  crew_members {
    uuid id
    text name
    text role
    text status
    boolean is_rosa
  }

  crew_unavailability {
    uuid id
    uuid crew_member_id
    timestamptz start_at
    timestamptz end_at
  }

  time_blocks {
    uuid id
    timestamptz start_at
    timestamptz end_at
    text reason
  }

  follow_up_tasks {
    uuid id
    uuid client_id
    uuid job_id
    text status
  }

  ai_usage_events {
    uuid id
    text provider
    text model
    text feature
    numeric estimated_cost_usd
  }

  site_videos {
    uuid id
    text youtube_video_id
    boolean is_visible
    text status
  }

  clients ||--o{ jobs : has
  crew_members ||--o{ jobs : assigned
  crew_members ||--o{ crew_unavailability : blocks
  clients ||--o{ follow_up_tasks : needs
  jobs ||--o{ follow_up_tasks : creates
```

## Security And Privacy

The public site collects only what Rosa needs to respond:

- Name
- Phone
- Address or ZIP
- Service details
- Preferred appointment times
- Review text and optional low-resolution review photo with consent

Security controls:

- Supabase Row Level Security is enabled on public tables.
- Public users can insert appointment and review submissions but cannot read private appointment data.
- Reviews are private until approved.
- Admin routes require server-side authentication.
- Service-role keys stay on the server.
- Review photo access goes through a server route.
- AI usage logging stores metadata, not full private conversations.

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
    S[OpenRouter free or paid models]
    T[OpenAI API models]
    U[Local Llama through Ollama or OpenAI-compatible server]
  end
```

Current production configuration can alternate providers by browser-session turn while keeping deterministic rules as the final fallback. OpenAI and local Llama/Ollama can be used by setting the OpenAI-compatible base URL, model, and API key in the same provider configuration pattern. See `docs/ai-usage-and-local-llm.md`.

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` after creating a Supabase Free project.

For isolated local database and browser integration testing, see `docs/local-testing.md`.

Useful test commands:

```bash
npm run lint
npm run test:coverage
npm run test:e2e
npm run test:e2e:db
npm run typecheck
npm run build
```

## Deployment

Deployments are configured through GitHub Actions to Cloudflare Workers. Production deploys must come from `main`.

Normal production path:

1. Work on a feature branch.
2. Open a pull request.
3. Let CI pass, including lint, typecheck, coverage tests, Playwright tests, production build, and Cloudflare/OpenNext build.
4. Merge the PR into `main`.
5. The `main` push triggers the Cloudflare production deploy.
6. Verify production behavior directly after deployment.

Local Cloudflare checks:

```bash
npm run cf:build
npm run cf:preview
```

Do not add billing unless explicitly approved.

## Supabase Setup

1. Create one Supabase project for Rosa only.
2. Run the migrations in `supabase/migrations/` or apply `supabase/schema.sql`.
3. Create a private storage bucket named `review-headshots`.
4. Add environment variables from `.env.example` to the host.

The schema enables Row Level Security on every public table. After running it, verify that RLS is enabled for:

- `appointment_requests`
- `reviews`
- `referrals`
- `clients`
- `jobs`
- `crew_members`
- `crew_unavailability`
- `time_blocks`
- `ai_usage_events`
- `site_videos`

Public users can submit appointments and reviews. They cannot read private appointment submissions. Reviews only appear after Rosa approves them.

## GitHub Governance

See `docs/github-governance.md` for the PR gate, CI, Dependabot, and branch-protection plan. Branch protection/rulesets require a GitHub plan that supports private-repo enforcement or a public repository.
