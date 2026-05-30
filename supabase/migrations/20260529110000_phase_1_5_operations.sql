alter table public.clients
add column if not exists email text,
add column if not exists preferred_communication_channel text not null default 'email';

alter table public.clients
drop constraint if exists clients_preferred_communication_channel_check;

alter table public.clients
add constraint clients_preferred_communication_channel_check
check (preferred_communication_channel in ('email', 'phone', 'sms', 'whatsapp'));

alter table public.jobs
add column if not exists google_calendar_event_id text,
add column if not exists calendar_invite_status text not null default 'not_sent',
add column if not exists last_invite_sent_at timestamptz;

alter table public.jobs
drop constraint if exists jobs_status_check;

alter table public.jobs
add constraint jobs_status_check
check (status in ('scheduled', 'needs_confirmation', 'invite_sent', 'confirmed', 'completed', 'cancelled', 'reschedule_needed'));

alter table public.jobs
drop constraint if exists jobs_calendar_invite_status_check;

alter table public.jobs
add constraint jobs_calendar_invite_status_check
check (calendar_invite_status in ('not_sent', 'needs_action', 'accepted', 'declined', 'tentative'));
