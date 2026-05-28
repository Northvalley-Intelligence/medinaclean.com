# CODEX.md

Repository instructions for AI coding agents working on `medinaclean.com`.

This is a public bilingual website for a small local cleaning business. Keep the site fast, inexpensive to operate, privacy-conscious, secure, and optimized for local SEO and answer-engine visibility.

## Project Priorities

1. Keep monthly infrastructure cost at `$0` unless the owner explicitly approves a paid service.
2. Protect customer data: appointment requests, addresses, phone numbers, pending reviews, and review photos are private by default.
3. Preserve bilingual English/Spanish support for user-facing content.
4. Optimize for local discovery around Woodstock, GA, ZIP `30188`, and nearby cleaning-service searches.
5. Keep the future operations app in mind without turning this public site into the operations app.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Free for database and storage
- Cloudflare-managed domain
- No paid Google Maps, email, SMS, or analytics dependency unless explicitly approved

## Required Checks

Run these before finishing any code change:

```bash
npm run lint
npm run typecheck
npm run build
```

If a check cannot run, report the reason clearly.

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

## Cost Controls

Do not add services that require billing without explicit approval:

- Google Maps Platform
- Twilio or paid SMS
- Paid transactional email
- Paid analytics
- Paid image/CDN transformations
- Paid database or hosting tiers

If a feature would be better with a paid provider, implement a free-safe fallback and document the tradeoff.

## Git And Deployment

- Repo target: `Northvalley-Intelligence/medinaclean.com`
- Commit author email should use `ferosh@northvalleyintel.com` unless the owner changes it.
- Domain is managed in Cloudflare.
- Hosting should remain on a free tier unless explicitly approved.

## Built By Credit

Preserve the site credit unless the owner asks to remove or change it:

Built by Northvalley Intelligence LLC.

- Website: `https://northvalleyintel.com`
- Contact: `contact@northvalleyintel.com`
