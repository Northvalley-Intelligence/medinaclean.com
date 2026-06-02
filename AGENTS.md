# Agent Instructions

Read `CODEX.md` before making changes in this repository.

For Next.js work, prefer the version-matched documentation bundled with the installed package under `node_modules/next/dist/docs/` when available.

Follow the repository TDD and PR safety rules in `CODEX.md` for every feature and bug fix. Do not treat tests as optional cleanup.

For every feature, bug fix, or content change, identify the expected behavior and the failing or missing verification before implementation. Run local verification before deploy. After deploy, verify the public production behavior directly before calling the work complete; if production verification cannot pass, state the blocker clearly. Keep GitHub CI responsibilities, Vercel responsibilities if ever introduced, and Cloudflare deploy/production verification responsibilities explicit in handoffs and final updates.

For user-visible workflows, add or update Playwright tests in `tests/e2e/`. For database-backed behavior, use local Supabase per `docs/local-testing.md`; never point automated tests at production data.

For user-facing forms, validate fields as soon as the user leaves the field when practical, and keep submit/server validation as the final safety net. Do not rely on submit-only validation for common fields such as phone, email, ZIP, street address, required names, dates, or prices. Show bilingual inline feedback for bilingual workflows.

Rosa is Spanish-speaking. Admin/private app workflows must be bilingual and default to Spanish. Preserve a clear English option, but do not make English the default for Rosa-facing operations screens.

Keep feature code modular enough to maintain as the operations app grows. Put validation, data shaping, calendar math, prompt/cost logic, and other business rules in `src/lib/*` with unit tests. Keep API routes thin: authenticate, parse, call shared helpers, persist, and respond. Keep pages/components focused on rendering and form wiring; when a page or route grows beyond a small readable unit, refactor after the failing test is green instead of accumulating one-off logic for the current task.
