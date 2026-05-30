# CODEX.md

Repository instructions for AI coding agents working on `medinaclean.com`.

This is a public bilingual website for a small local cleaning business. Keep the site fast, inexpensive to operate, privacy-conscious, secure, and optimized for local SEO and answer-engine visibility.

## Project Priorities

1. Keep monthly infrastructure cost at `$0` unless the owner explicitly approves a paid service.
2. Protect customer data: appointment requests, addresses, phone numbers, pending reviews, and review photos are private by default.
3. Preserve bilingual English/Spanish support for user-facing content.
4. Optimize for local discovery around Woodstock, GA, ZIP `30188`, and nearby cleaning-service searches.
5. Keep the future operations app in mind without turning this public site into the operations app.
6. Rosa is Spanish-speaking; admin/private operations screens must default to Spanish with an English option available.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Free for database and storage
- Cloudflare-managed domain and Cloudflare Workers deployment through OpenNext
- No paid Google Maps, email, SMS, or analytics dependency unless explicitly approved

## Required Checks

Run these before finishing any code change:

```bash
npm run lint
npm run test:coverage
npm run test:e2e
npm run typecheck
npm run build
```

If a check cannot run, report the reason clearly.

## TDD And Test Coverage

Every feature and bug fix must include a test in the same change unless the change is documentation-only, configuration-only, or an explicit emergency production fix. If a test cannot be added, document the reason and the manual verification performed.

Default workflow:

1. Add or update the failing test that describes the desired behavior or bug regression.
2. Implement the smallest production change that makes the test pass.
3. Run the focused test while iterating.
4. Run the full required checks before handoff.

Test expectations:

- Use unit tests for pure business logic, validators, formatting, pricing rules, AI prompt builders, and cost calculations.
- Use integration tests for API routes, Supabase payload mapping, auth boundaries, and flows that cross modules.
- Use Playwright for browser-visible workflows such as public lead capture, admin login, client onboarding, chat, scheduling, and follow-up flows.
- Prefer local Supabase for DB-backed integration tests. Automated tests must not use Rosa's production Supabase project.
- Add regression tests for every reported bug.
- Cover bilingual English/Spanish behavior when changing user-facing copy or communication logic.
- Cover Spanish-default behavior for Rosa-facing admin/private app workflows with Playwright.
- Cover security-sensitive behavior, including private data access, service-role-only operations, and public form validation.
- Keep AI features deterministic in tests by mocking providers; never call a live AI provider from CI.
- Keep tests privacy-safe. Do not commit real client names, phone numbers, addresses, API keys, or Rosa's private client details.
- Coverage must not be reduced to bypass failures. If thresholds need to change, explain why in the PR.
- The current coverage baseline starts with `src/lib/service-area.ts` because the pre-existing app did not have tests. New production modules added for the operations app should be included in coverage as they are introduced.

Current test command:

```bash
npm run test:coverage
npm run test:e2e
```

CI enforces linting, typechecking, coverage tests, Playwright integration tests, production build, and high-severity dependency audit.

## Modularity And Maintainability

Avoid making a feature work by piling business logic into a page, component, or route handler. Put reusable validation, data shaping, calendar math, AI prompt/cost logic, and formatting rules in `src/lib/*` with unit tests. Keep API routes thin: authenticate, parse, call shared helpers, persist, and respond. Keep pages focused on rendering, data loading, and form wiring.

When a page or route grows beyond a small readable unit, refactor it behind the green test rather than leaving one-off logic in place. Prefer shared admin components for repeated navigation, shell layout, status messages, and repeated list/card patterns. Do not mix broad refactors into unrelated product changes, but do make small extraction refactors when they reduce duplication or make integration tests easier to reason about.

## Local Integration Testing

Keep testing isolated and local whenever practical. See `docs/local-testing.md`.

Default rules:

- Use local Supabase through the Supabase CLI for database-backed development and integration tests.
- Keep `.env.local` pointed at local Supabase unless intentionally testing against a disposable cloud test project.
- Never run automated tests against Rosa's production data.
- Reset local database state before stateful integration tests.
- Use synthetic client names, phones, addresses, and notes in tests.
- If a feature cannot yet be tested with local Supabase in CI, add the local test and document the Docker/Supabase prerequisite.

## SEO Requirements

Every public page should have:

- Specific `title` and `description`
- Canonical URL
- Language alternates when applicable
- Crawlable HTML content, not content hidden behind client-only rendering
- Clear heading hierarchy
- Descriptive internal links
- Fast loading behavior and minimal JavaScript

For local service pages or sections, include:

- Business name: `Medina Clean`
- Service types: house cleaning, apartment cleaning, condo cleaning, deep cleaning, recurring cleaning, small business cleaning
- Service area references: Woodstock, GA, `30188`, nearby Georgia communities
- Clear contact and appointment request CTA

Do not keyword-stuff. Write natural local-service copy that answers real customer questions.

## AEO / AI Answer Visibility

When adding content, make it easy for AI answer engines to extract accurate answers:

- Use concise FAQ-style question and answer blocks for common customer questions.
- Keep pricing assumptions explicit.
- Make service area limitations explicit.
- Use structured data where appropriate: `CleaningService`, `LocalBusiness`, `Service`, `Offer`, `FAQPage`, `ContactPoint`, and approved `Review`.
- Do not mark pending or unapproved reviews as public schema.
- Keep claims factual and verifiable. Avoid unsupported claims like "best in Georgia" unless backed by evidence.

Consider adding or maintaining:

- `sitemap.ts`
- `robots.ts`
- JSON-LD on major pages
- Plain-language privacy policy
- Future `llms.txt` only if it stays accurate and does not expose private information

## Security Rules

- Never commit secrets, API keys, service-role keys, tokens, or `.env.local`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Keep Supabase Row Level Security enabled on every public table.
- Public users may insert appointment and review submissions, but must not read private appointment data.
- Reviews must remain pending until approved.
- Only approved reviews with consent may be shown publicly.
- Validate and bound all form input server-side.
- Limit uploaded review images by type and size.
- Store resized low-resolution review photos only.
- Avoid `dangerouslySetInnerHTML` except for controlled JSON-LD generated from trusted local data.
- Do not use middleware as the only authorization layer for sensitive data.
- Keep dependency updates deliberate and verify with the required checks.
- Protect private admin/app routes with server-side authorization checks before exposing client, lead, job, commission, or AI usage data.
- Do not send client PII to AI providers unless the feature explicitly requires it and the data is minimized.
- Log AI usage metadata, not full private conversations, in `ai_usage_events`.
- Prefer allowlists for public API request fields and reject unknown or oversized payloads.

## Privacy Rules

Collect only what Rosa needs to respond:

- Name
- Phone
- Address or ZIP
- Service details
- Preferred appointment times
- Review text and optional photo with consent

Do not add analytics, tracking pixels, session replay, ad platforms, or third-party embeds without explicit approval.

Appointment submissions are private business leads. Review submissions are private until Rosa approves them.

## Supabase Rules

- One Supabase project per client.
- This project should connect only to Rosa's `medina-clean` Supabase project.
- Keep migrations in `supabase/`.
- Make RLS policies part of SQL migrations, not manual-only setup.
- Use backend/server access for business automation and service-role operations.
- Use anon access only for narrowly-scoped public submission and approved public review reads.
- Use local Supabase for local development and integration testing. Production Supabase is for production data only.

## Forms

Appointment form must collect:

- Name
- Phone
- Address
- ZIP
- Service type
- Bedrooms
- Bathrooms
- Three preferred times
- Optional notes

Address validation must not require paid APIs. The current free approach is ZIP centroid validation within about 20 miles of `30188`, with Rosa manually confirming exact availability.

Review form must collect:

- Name
- Rating
- Review text
- Optional headshot
- Consent to publish

Review photos should be resized/compressed before upload and rejected server-side if too large.

## Content And Design

- Keep the visual theme warm, professional, and pink-accented without making the site look childish.
- Do not hide the business purpose behind a marketing splash page.
- The first viewport should clearly communicate cleaning services, service area, and how to contact Rosa.
- Leave clear space for Rosa's real photos.
- Maintain English and Spanish versions together when changing user-facing copy.
- Admin/private operations screens are Rosa-facing and must default to Spanish. Keep English available for Ferosh/testing, but Spanish is the primary language.

## Cost Controls

Do not add services that require billing without explicit approval:

- Google Maps Platform
- Twilio or paid SMS
- Paid transactional email
- Paid analytics
- Paid image/CDN transformations
- Paid database or hosting tiers

Cloudflare Workers/OpenNext configuration should stay compatible with the free tier unless the owner explicitly approves otherwise.

If a feature would be better with a paid provider, implement a free-safe fallback and document the tradeoff.

## Git And Deployment

- Repo target: `Northvalley-Intelligence/medinaclean.com`
- Commit author email should use `ferosh@northvalleyintel.com` unless the owner changes it.
- Domain is managed in Cloudflare.
- Hosting should remain on a free tier unless explicitly approved.

Production safety rules:

- Do not commit directly to `main` for normal work.
- Create a feature branch for every change, such as `feature/admin-client-onboarding` or `fix/appointment-validation`.
- Merge to `main` only through a pull request.
- Require CI to pass before merge: security audit, lint, typecheck, coverage tests, and build.
- Require at least one review before merge when another trusted collaborator is available.
- Keep `main` deployable at all times.
- Use small PRs that can be reviewed and rolled back safely.
- Do not mix unrelated refactors with product changes.
- Deploy production from `main` only.
- Use GitHub branch protection for `main` to block force pushes, require pull requests, require status checks, and prevent direct commits.
- Keep secrets in GitHub Actions secrets or Cloudflare secrets, never in source control.
- If a production hotfix is necessary, create a hotfix branch, open a PR, run the checks, merge, and then backfill any missing regression test immediately.

## Built By Credit

Preserve the site credit unless the owner asks to remove or change it:

Built by Northvalley Intelligence LLC.

- Website: `https://northvalleyintel.com`
- Contact: `contact@northvalleyintel.com`
