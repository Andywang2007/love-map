create table if not exists public.meeting_records (
  id text primary key,
  city text not null,
  place_name text,
  latitude double precision,
  longitude double precision,
  places jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date,
  stay text not null,
  stay_latitude double precision,
  stay_longitude double precision,
  scene text default '',
  note text not null,
  daily_events jsonb not null default '[]'::jsonb,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.meeting_records
add column if not exists place_name text,
add column if not exists latitude double precision,
add column if not exists longitude double precision,
add column if not exists places jsonb not null default '[]'::jsonb,
add column if not exists stay_latitude double precision,
add column if not exists stay_longitude double precision,
add column if not exists daily_events jsonb not null default '[]'::jsonb;

alter table public.meeting_records
alter column scene set default '',
alter column scene drop not null;

alter table public.meeting_records enable row level security;

drop policy if exists "Public can read meeting records" on public.meeting_records;
create policy "Public can read meeting records"
on public.meeting_records for select
using (true);

drop policy if exists "Public can insert meeting records" on public.meeting_records;
create policy "Public can insert meeting records"
on public.meeting_records for insert
with check (true);

drop policy if exists "Public can update meeting records" on public.meeting_records;
create policy "Public can update meeting records"
on public.meeting_records for update
using (true)
with check (true);

drop policy if exists "Public can delete meeting records" on public.meeting_records;
create policy "Public can delete meeting records"
on public.meeting_records for delete
using (true);

insert into storage.buckets (id, name, public)
values ('meeting-photos', 'meeting-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read meeting photos" on storage.objects;
create policy "Public can read meeting photos"
on storage.objects for select
using (bucket_id = 'meeting-photos');

drop policy if exists "Public can upload meeting photos" on storage.objects;
create policy "Public can upload meeting photos"
on storage.objects for insert
with check (bucket_id = 'meeting-photos');

notify pgrst, 'reload schema';
