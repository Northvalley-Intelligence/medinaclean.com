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

alter table public.appointment_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.referrals enable row level security;

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

create index if not exists appointment_requests_created_at_idx on public.appointment_requests (created_at desc);
create index if not exists reviews_status_created_at_idx on public.reviews (status, created_at desc);
