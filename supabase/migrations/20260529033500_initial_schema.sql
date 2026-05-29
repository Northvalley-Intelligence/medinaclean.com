create extension if not exists "pgcrypto";

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  language text not null check (language in ('en', 'es')),
  name text not null,
  phone text not null,
  address text not null,
  zip_code text not null,
  service_type text not null,
  bedrooms integer not null check (bedrooms between 1 and 5),
  bathrooms numeric(3,1) not null check (bathrooms >= 1 and bathrooms <= 6),
  preferred_time_1 timestamptz not null,
  preferred_time_2 timestamptz not null,
  preferred_time_3 timestamptz not null,
  notes text,
  distance_miles numeric(5,2),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'accepted', 'declined', 'completed')),
  source text not null default 'website'
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  language text not null check (language in ('en', 'es')),
  name text not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  photo_path text,
  consent_to_publish boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_name text not null,
  referrer_phone text not null,
  referred_name text not null,
  referred_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'credited', 'declined'))
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  phone text,
  address text,
  zip_code text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  cleaning_frequency text not null default 'unknown' check (
    cleaning_frequency in ('weekly', 'every_2_weeks', 'every_3_weeks', 'monthly', 'one_time', 'custom', 'unknown')
  ),
  usual_day text,
  usual_time text,
  current_price_usd numeric(8,2) check (current_price_usd is null or current_price_usd >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'lost', 'prospect')),
  source text not null default 'existing_client',
  can_ask_for_review boolean not null default false,
  can_ask_for_referral boolean not null default false,
  notes text
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.clients(id) on delete cascade,
  scheduled_for timestamptz,
  estimated_duration_minutes integer check (
    estimated_duration_minutes is null or estimated_duration_minutes between 30 and 1440
  ),
  service_type text not null default 'recurring_cleaning',
  status text not null default 'scheduled' check (
    status in ('scheduled', 'needs_confirmation', 'completed', 'cancelled', 'reschedule_needed')
  ),
  price_usd numeric(8,2) check (price_usd is null or price_usd >= 0),
  notes text
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid references public.clients(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  due_at timestamptz,
  task_type text not null check (
    task_type in ('confirm_next_cleaning', 'ask_for_review', 'ask_for_referral', 'recurring_offer', 'manual')
  ),
  status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  notes text
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  feature text not null,
  provider text not null,
  model text not null,
  mode text not null check (mode in ('free_api', 'paid_api', 'local')),
  request_type text not null check (
    request_type in ('client_chat', 'reply_draft', 'translation', 'summary', 'quote_helper', 'lead_scoring', 'other')
  ),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  estimated_cost_usd numeric(10, 6) not null default 0 check (estimated_cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  success boolean not null default true,
  error_code text,
  lead_id uuid,
  client_id uuid,
  conversation_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.appointment_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.referrals enable row level security;
alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "public can submit appointment requests" on public.appointment_requests;
create policy "public can submit appointment requests"
on public.appointment_requests for insert
to anon
with check (true);

drop policy if exists "public can submit reviews" on public.reviews;
create policy "public can submit reviews"
on public.reviews for insert
to anon
with check (status = 'pending');

drop policy if exists "public can read approved reviews" on public.reviews;
create policy "public can read approved reviews"
on public.reviews for select
to anon
using (status = 'approved' and consent_to_publish = true);

drop policy if exists "public can submit referrals" on public.referrals;
create policy "public can submit referrals"
on public.referrals for insert
to anon
with check (true);

drop policy if exists "service role can manage clients" on public.clients;
create policy "service role can manage clients"
on public.clients for all
to service_role
using (true)
with check (true);

drop policy if exists "service role can manage jobs" on public.jobs;
create policy "service role can manage jobs"
on public.jobs for all
to service_role
using (true)
with check (true);

drop policy if exists "service role can manage follow up tasks" on public.follow_up_tasks;
create policy "service role can manage follow up tasks"
on public.follow_up_tasks for all
to service_role
using (true)
with check (true);

drop policy if exists "service role can manage ai usage events" on public.ai_usage_events;
create policy "service role can manage ai usage events"
on public.ai_usage_events for all
to service_role
using (true)
with check (true);

create index if not exists appointment_requests_created_at_idx on public.appointment_requests (created_at desc);
create index if not exists reviews_status_created_at_idx on public.reviews (status, created_at desc);
create index if not exists clients_status_created_at_idx on public.clients (status, created_at desc);
create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists jobs_client_scheduled_idx on public.jobs (client_id, scheduled_for desc);
create index if not exists follow_up_tasks_due_status_idx on public.follow_up_tasks (status, due_at asc);
create index if not exists ai_usage_events_created_at_idx on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_provider_model_idx on public.ai_usage_events (provider, model, created_at desc);
create index if not exists ai_usage_events_feature_idx on public.ai_usage_events (feature, created_at desc);

create or replace view public.ai_usage_monthly_summary as
select
  date_trunc('month', created_at)::date as month,
  mode,
  provider,
  model,
  feature,
  request_type,
  count(*) as request_count,
  sum(input_tokens) as input_tokens,
  sum(output_tokens) as output_tokens,
  sum(cached_input_tokens) as cached_input_tokens,
  sum(estimated_cost_usd) as estimated_cost_usd,
  avg(latency_ms) as avg_latency_ms,
  count(*) filter (where not success) as error_count
from public.ai_usage_events
group by 1, 2, 3, 4, 5, 6;
