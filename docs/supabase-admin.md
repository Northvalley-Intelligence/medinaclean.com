# Supabase Admin Workflow

## Values Needed From Supabase

Safe to share in normal project configuration:

- Project URL
- Anon / publishable key

Secret values:

- Service role key

The service role key must only be stored in `.env.local` and hosting environment variables. It must never be placed in browser code or committed to git.

## Required Setup

1. Run `supabase/schema.sql`.
2. Confirm Row Level Security is enabled for all public tables.
3. Create a private storage bucket named `review-headshots`.
4. Add environment variables from `.env.example`.

## Review Moderation

Pending reviews are stored with `status = 'pending'`.

Approve a review:

```sql
update public.reviews
set status = 'approved', reviewed_at = now()
where id = '<review-id>';
```

Reject a review:

```sql
update public.reviews
set status = 'rejected', reviewed_at = now()
where id = '<review-id>';
```

Only approved reviews with `consent_to_publish = true` are readable by anonymous public users.

## Appointment Requests

Appointment requests are private. Public users can submit requests but cannot read them.

Status values:

- `pending`
- `contacted`
- `accepted`
- `declined`
- `completed`

## Future Ops App

The operations app can connect to the same Rosa-only Supabase project using backend-only service credentials. It should not use public anon access for business automation.
