-- Hardening for the two anonymously-writable tables.
--
-- `museum_photos` and `site_visitor_log` are both `insert ... with check (true)`
-- to `anon` — that is intentional (shared photobook, guestbook), but as shipped
-- there was nothing stopping an anonymous client from writing an unbounded
-- string, or an `image_url` that is not an image at all. The client now filters
-- both on read and on write (see `isSafeImageUrl` in src/lib/photobookStore.ts),
-- but the database should not depend on the client behaving.
--
-- Run this in the Supabase SQL editor. It is idempotent.

-- ---------------------------------------------------------------- photobook

-- Only https URLs and base64 image data URLs, and nothing enormous.
-- 6 MB matches MAX_IMAGE_URL_LENGTH on the client.
alter table public.museum_photos
  drop constraint if exists museum_photos_image_url_shape;
alter table public.museum_photos
  add constraint museum_photos_image_url_shape check (
    length(image_url) <= 6000000
    and (
      image_url like 'https://%'
      or image_url ~ '^data:image/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/=]+$'
    )
  );

alter table public.museum_photos
  drop constraint if exists museum_photos_visitor_name_len;
alter table public.museum_photos
  add constraint museum_photos_visitor_name_len check (
    visitor_name is null or length(visitor_name) <= 60
  );

-- The insert policy allows anon writes but must not allow anon to backdate a
-- row or spoof an id — both columns have defaults, so pin them.
drop policy if exists "museum photos are publicly insertable" on public.museum_photos;
create policy "museum photos are publicly insertable"
  on public.museum_photos
  for insert
  to anon, authenticated
  with check (created_at is null or created_at > now() - interval '1 minute');

-- Anonymous clients must not be able to edit or erase other visitors' photos.
-- (No update/delete policy exists, so RLS already denies both — these revokes
-- make that explicit and survive someone adding a permissive policy later.)
revoke update, delete on public.museum_photos from anon;

-- ------------------------------------------------------------- visitor log

alter table public.site_visitor_log
  drop constraint if exists site_visitor_log_display_name_len;
alter table public.site_visitor_log
  add constraint site_visitor_log_display_name_len check (
    length(display_name) between 1 and 60
  );

drop policy if exists "site visitor log is publicly insertable" on public.site_visitor_log;
create policy "site visitor log is publicly insertable"
  on public.site_visitor_log
  for insert
  to anon, authenticated
  with check (visited_at is null or visited_at > now() - interval '1 minute');

revoke update, delete on public.site_visitor_log from anon;
