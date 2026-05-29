## Summary

- 

## Testing

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:coverage`
- [ ] `npm run test:e2e -- --project=chromium`
- [ ] `npm run build`
- [ ] `npm audit --audit-level=high`

## Safety Checklist

- [ ] This PR is not a direct commit to `main`.
- [ ] User-facing changes preserve English/Spanish behavior.
- [ ] Rosa-facing admin changes default to Spanish.
- [ ] Private client, lead, review, and service-role data are not exposed to browser code.
- [ ] Supabase schema/RLS changes are included as migrations.
- [ ] New features or bug fixes include unit or Playwright coverage.
