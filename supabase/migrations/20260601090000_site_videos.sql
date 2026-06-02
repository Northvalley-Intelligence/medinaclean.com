create table if not exists public.site_videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title_en text not null,
  title_es text not null,
  description text,
  youtube_video_id text not null unique,
  youtube_url text not null,
  embed_url text not null,
  privacy_status text not null default 'public' check (privacy_status in ('public', 'unlisted', 'private')),
  is_visible boolean not null default true
);

alter table public.site_videos enable row level security;

drop policy if exists "public can read visible site videos" on public.site_videos;
create policy "public can read visible site videos"
on public.site_videos for select
to anon
using (is_visible = true);

drop policy if exists "service role can manage site videos" on public.site_videos;
create policy "service role can manage site videos"
on public.site_videos for all
to service_role
using (true)
with check (true);

create index if not exists site_videos_visible_created_idx on public.site_videos (is_visible, created_at desc);
