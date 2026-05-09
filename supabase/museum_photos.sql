-- Shared photobook (desktop Photobooth / Scrapbook). Applied via Supabase MCP as
-- migration `museum_photos_shared_gallery`; keep this file aligned with prod.

create table if not exists public.museum_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  visitor_name text,
  created_at timestamptz not null default now()
);

alter table public.museum_photos
  add column if not exists visitor_name text;

alter table public.museum_photos enable row level security;

drop policy if exists "museum photos are publicly readable" on public.museum_photos;
create policy "museum photos are publicly readable"
  on public.museum_photos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "museum photos are publicly insertable" on public.museum_photos;
create policy "museum photos are publicly insertable"
  on public.museum_photos
  for insert
  to anon, authenticated
  with check (true);

-- Live updates for subscribeToSharedPhotos()
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'museum_photos'
  ) then
    alter publication supabase_realtime add table public.museum_photos;
  end if;
end $$;
