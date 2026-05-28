# Deployment Notes

This site is built by Northvalley Intelligence LLC.

- Website: https://northvalleyintel.com
- Contact: contact@northvalleyintel.com

## Accounts

The site owner should create and own the Supabase and hosting projects. Codex should not create accounts because credentials, ownership, and future billing control belong to the owner.

## Free-Only Setup

- Supabase: Free project, no billing required.
- Hosting: Vercel Hobby or Cloudflare Pages, no billing required if permitted by current terms.
- Domain/DNS: `medinaclean.com` is managed in Cloudflare.
- Maps: no Google Maps billing. The site uses local ZIP validation only.
- Email/SMS: not required for launch.

## Cloudflare DNS

If hosting on Vercel, connect `medinaclean.com` in the Vercel project first, then add the DNS records Vercel provides inside Cloudflare.

Typical Vercel records:

- Apex `medinaclean.com`: `A` record to Vercel's provided IP, or Vercel's current recommended apex record.
- `www`: `CNAME` to Vercel's provided target.

Keep Cloudflare proxy settings aligned with the host's current guidance. Do not enable paid Cloudflare products unless explicitly approved.

## Environment Variables

Required when Supabase is enabled:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_REVIEW_BUCKET`

Optional contact values:

- `NEXT_PUBLIC_ROSA_PHONE`
- `NEXT_PUBLIC_ROSA_WHATSAPP`
- `NEXT_PUBLIC_ROSA_INSTAGRAM`

## Privacy Guardrails

- Keep appointment requests private.
- Keep reviews private until approved.
- Keep Row Level Security enabled on every public Supabase table.
- Collect consent before storing a review headshot.
- Store resized low-resolution images only.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend code.
