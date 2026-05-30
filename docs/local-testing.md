# Local Testing

Default testing should be isolated from Rosa's production data.

## Test Layers

Use these layers from the beginning:

- Unit tests: `npm run test:coverage`
- Browser integration tests: `npm run test:e2e`
- Local database integration tests: Supabase CLI against local Docker services

Do not use Rosa's production Supabase project for automated tests.

## Local Supabase

The project uses Supabase REST in production, so local integration testing should use the Supabase CLI stack instead of a plain standalone Postgres database. This gives us local Postgres plus the local REST/Auth/Storage services that behave closer to production.

Prerequisites:

- A Docker-compatible runtime running
- Node dependencies installed with `npm install`

This repo has been verified locally with the free Colima runtime:

```bash
brew install colima docker docker-compose
colima start --cpu 4 --memory 6 --disk 40 --mount-type=virtiofs
```

Docker Desktop should also work, but it is not required.

Start local Supabase:

```bash
npm run db:start
```

Apply/reset the local schema:

```bash
npm run db:reset
```

Show local URLs and keys:

```bash
npm run db:status
```

Stop local Supabase:

```bash
npm run db:stop
```

## Local Environment

Use `.env.local` for local development only. Do not commit it.

Typical local values after `npm run db:start`:

```bash
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key from supabase status>
SUPABASE_REVIEW_BUCKET=review-headshots

ROSA_ADMIN_PASSWORD=test-admin
ADMIN_SESSION_SECRET=<local random secret>
```

Generate a local session secret:

```bash
openssl rand -hex 32
```

## Playwright

Install the browser once locally:

```bash
npx playwright install chromium
```

Run browser tests:

```bash
npm run test:e2e
```

The Playwright config starts the Next dev server with test admin credentials. Browser tests must use synthetic client data only.

Run database-backed browser tests:

```bash
npm run db:start
npm run db:reset
npm run test:e2e:db
```

`npm run test:e2e:db` assumes `.env.local` points at local Supabase and that Docker Desktop is running.

## Database-Backed Tests

When adding a feature that writes or reads business data, add a Playwright or API integration test that runs against local Supabase.

Rules:

- Seed only fake data.
- Reset local Supabase before stateful integration tests.
- Never point automated tests at production Supabase.
- Keep test records obviously fake, such as `Test Client` and `555-0100`.
- Verify authorization boundaries: public users cannot read private business data.
- Use `npm run test:e2e:db` for flows that must prove persistence.

Future CI can run the local Supabase stack in Docker for database-backed tests. Until that job exists, any DB-backed test that requires Docker must be documented and runnable locally with the commands above.

## Notes

Local Supabase analytics are disabled in `supabase/config.toml`. The app does not need analytics for integration tests, and disabling it avoids Docker socket mount problems with Colima.
