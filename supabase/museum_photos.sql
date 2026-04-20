create table if not exists public.museum_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.museum_photos enable row level security;

create policy "museum photos are publicly readable"
  on public.museum_photos
  for select
  to anon
  using (true);

create policy "museum photos are publicly insertable"
  on public.museum_photos
  for insert
  to anon
  with check (true);
