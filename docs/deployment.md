# Deployment Notes

This site is built by Northvalley Intelligence LLC.

- Website: https://northvalleyintel.com

## Accounts

The site owner should create and own the Supabase and hosting projects. Codex should not create accounts because credentials, ownership, and future billing control belong to the owner.

## Free-Only Setup

- Supabase: Free project, no billing required.
- Hosting: Cloudflare Workers using the OpenNext adapter, staying on the free tier unless explicitly approved.
- Domain/DNS: `medinaclean.com` is managed in Cloudflare.
- Maps: no Google Maps billing. The site uses local ZIP validation only.
- Email: internal notifications use Resend for accepted public chat, appointment, and review submissions.
- SMS: not required for launch.

## GitHub Actions Deployment

The workflow at `.github/workflows/deploy-cloudflare.yml` deploys `main` to Cloudflare Workers.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ROSA_ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `RESEND_API_KEY`
- `CHAT_NOTIFY_TO`
- `TURNSTILE_SECRET_KEY`

Optional GitHub repository secrets:

- `NEXT_PUBLIC_ROSA_PHONE`
- `NEXT_PUBLIC_ROSA_PHONE_DISPLAY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `SITE_NOTIFY_TO`
- `SITE_NOTIFY_FROM`
- `CHAT_NOTIFY_FROM`

Use `https://medinaclean.com` for `NEXT_PUBLIC_SITE_URL` in production.

The workflow writes configured Supabase/contact values as Cloudflare Worker secrets during deploy so runtime API routes can access them. Empty optional values are skipped.

## Cloudflare DNS

After the first successful Worker deployment, connect `medinaclean.com` to the Worker in Cloudflare:

1. Open Cloudflare dashboard.
2. Go to Workers & Pages.
3. Select the `medinaclean-com` Worker.
4. Add custom domain `medinaclean.com`.
5. Add `www.medinaclean.com` if Rosa wants the `www` version too.

The repo manages Worker routes in `wrangler.jsonc`, so the Cloudflare API token must be able to edit Worker routes for the `medinaclean.com` zone.

Required Cloudflare token permissions:

- `Account` -> `Workers Scripts` -> `Edit`
- `Account` -> `Account Settings` -> `Read`
- `Zone` -> `Workers Routes` -> `Edit`
- `Zone` -> `Zone` -> `Read`

Do not enable paid Cloudflare products unless explicitly approved.

## Local Cloudflare Preview

```bash
npm run cf:preview
```

This builds with the Cloudflare OpenNext adapter and previews in the Workers runtime.

## Environment Variables

Required when Supabase is enabled:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REVIEW_BUCKET`
- `ROSA_ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

Public contact values:

- `NEXT_PUBLIC_ROSA_PHONE`
- `NEXT_PUBLIC_ROSA_PHONE_DISPLAY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Notification values:

- `RESEND_API_KEY`
- `SITE_NOTIFY_TO`, or reuse `CHAT_NOTIFY_TO` / `ASSESSMENT_HOST_EMAIL`
- `SITE_NOTIFY_FROM`, or reuse `CHAT_NOTIFY_FROM`

Bot protection:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Privacy Guardrails

- Keep appointment requests private.
- Keep reviews private until approved.
- Keep Row Level Security enabled on every public Supabase table.
- Collect consent before storing a review headshot.
- Store resized low-resolution images only.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend code.
