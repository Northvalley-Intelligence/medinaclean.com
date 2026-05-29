create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text not null,
  status text not null default 'blocked' check (status in ('blocked', 'reserved')),
  notes text,
  check (end_at > start_at)
);

alter table public.time_blocks enable row level security;

drop policy if exists "service role can manage time blocks" on public.time_blocks;
create policy "service role can manage time blocks"
on public.time_blocks for all
to service_role
using (true)
with check (true);

create index if not exists time_blocks_start_end_idx on public.time_blocks (start_at, end_at);
