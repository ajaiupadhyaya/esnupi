-- Optional: store the visitor’s name on each photobook upload (from the name gate).
alter table public.museum_photos
  add column if not exists visitor_name text;
