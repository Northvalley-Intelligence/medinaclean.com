create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  phone text,
  email text,
  role text not null default 'cleaner' check (role in ('owner', 'cleaner', 'contractor')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_rosa boolean not null default false,
  default_weekday_start text not null default '10:00',
  default_weekday_end text not null default '17:00',
  notes text
);

create unique index if not exists crew_members_one_rosa_idx on public.crew_members (is_rosa) where is_rosa;

create table if not exists public.crew_unavailability (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text not null default 'Unavailable',
  notes text,
  check (end_at > start_at)
);

alter table public.jobs
add column if not exists crew_member_id uuid references public.crew_members(id) on delete set null;

alter table public.crew_members enable row level security;
alter table public.crew_unavailability enable row level security;

drop policy if exists "service role can manage crew members" on public.crew_members;
create policy "service role can manage crew members"
on public.crew_members for all
to service_role
using (true)
with check (true);

drop policy if exists "service role can manage crew unavailability" on public.crew_unavailability;
create policy "service role can manage crew unavailability"
on public.crew_unavailability for all
to service_role
using (true)
with check (true);

insert into public.crew_members (name, role, status, is_rosa, default_weekday_start, default_weekday_end, notes)
select 'Rosa Medina', 'owner', 'active', true, '10:00', '17:00', 'Owner and default crew member for Medina Clean.'
where not exists (select 1 from public.crew_members where is_rosa = true);

create index if not exists crew_members_status_name_idx on public.crew_members (status, name);
create index if not exists crew_unavailability_member_start_end_idx on public.crew_unavailability (crew_member_id, start_at, end_at);
create index if not exists jobs_crew_member_scheduled_idx on public.jobs (crew_member_id, scheduled_for);
