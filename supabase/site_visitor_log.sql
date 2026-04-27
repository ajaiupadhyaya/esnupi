-- Run in Supabase SQL editor. Public guestbook of display names from the /visit-classic gate.
create table if not exists public.site_visitor_log (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  visited_at timestamptz not null default now()
);

alter table public.site_visitor_log enable row level security;

create policy "site visitor log is publicly readable"
  on public.site_visitor_log
  for select
  to anon
  using (true);

create policy "site visitor log is publicly insertable"
  on public.site_visitor_log
  for insert
  to anon
  with check (true);

-- Realtime (enable in dashboard if not already): add table to supabase_realtime publication.
