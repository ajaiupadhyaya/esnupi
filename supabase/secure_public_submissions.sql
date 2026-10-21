-- Apply AFTER the schema files and harden_public_write_tables.sql.
-- Existing rows are preserved. NOT VALID checks still enforce all new writes.
-- This bounds anonymous storage abuse; CAPTCHA and per-client limits remain
-- necessary to prevent an attacker exhausting the shared submission budget.
begin;

create schema if not exists esnupi_private;
revoke all on schema esnupi_private from public, anon, authenticated;
create table if not exists esnupi_private.submission_budget (
  kind text primary key,
  minute_start timestamptz not null default date_trunc('minute', clock_timestamp()),
  minute_count integer not null default 0,
  day_start timestamptz not null default (date_trunc('day', clock_timestamp() at time zone 'UTC') at time zone 'UTC'),
  day_count integer not null default 0
);
revoke all on esnupi_private.submission_budget from public, anon, authenticated;
insert into esnupi_private.submission_budget(kind)
values ('museum_photos'), ('site_visitor_log') on conflict do nothing;

create or replace function esnupi_private.guard_submission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  budget esnupi_private.submission_budget%rowtype;
  stamp timestamptz := clock_timestamp();
  minute_limit integer;
  day_limit integer;
  total_limit integer;
  row_count bigint;
begin
  if tg_table_schema <> 'public' or tg_table_name not in ('museum_photos', 'site_visitor_log') then
    raise exception 'Unsupported submission table';
  end if;
  -- Fixed-row lock serializes both budget checks and concurrent row inserts.
  select * into strict budget from esnupi_private.submission_budget
    where kind = tg_table_name for update;
  if budget.minute_start < date_trunc('minute', stamp) then
    budget.minute_start := date_trunc('minute', stamp);
    budget.minute_count := 0;
  end if;
  if budget.day_start < date_trunc('day', stamp at time zone 'UTC') at time zone 'UTC' then
    budget.day_start := date_trunc('day', stamp at time zone 'UTC') at time zone 'UTC';
    budget.day_count := 0;
  end if;
  new.id := gen_random_uuid();
  if tg_table_name = 'museum_photos' then
    minute_limit := 10; day_limit := 100; total_limit := 500;
    new.created_at := stamp;
    new.visitor_name := nullif(btrim(new.visitor_name), '');
    if octet_length(new.image_url) > 1000000 or
      new.image_url !~ '^data:image/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$' then
      raise exception 'Unsupported image: raster data URLs up to 1 MB only' using errcode = '23514';
    end if;
    if length(new.visitor_name) > 60 then
      raise exception 'Visitor name exceeds 60 characters' using errcode = '23514';
    end if;
    select count(*) into row_count from public.museum_photos;
  else
    minute_limit := 30; day_limit := 1000; total_limit := 5000;
    new.visited_at := stamp;
    new.display_name := btrim(new.display_name);
    if length(new.display_name) not between 1 and 60 then
      raise exception 'Display name must contain 1 to 60 characters' using errcode = '23514';
    end if;
    select count(*) into row_count from public.site_visitor_log;
  end if;
  if budget.minute_count >= minute_limit or budget.day_count >= day_limit or row_count >= total_limit then
    raise exception 'Submission limit reached. Please try later.' using errcode = 'P0001';
  end if;
  update esnupi_private.submission_budget set
    minute_start = budget.minute_start, minute_count = budget.minute_count + 1,
    day_start = budget.day_start, day_count = budget.day_count + 1
    where kind = tg_table_name;
  return new;
end;
$$;
revoke all on function esnupi_private.guard_submission() from public, anon, authenticated;

drop trigger if exists secure_submission on public.museum_photos;
create trigger secure_submission before insert on public.museum_photos
  for each row execute function esnupi_private.guard_submission();
drop trigger if exists secure_submission on public.site_visitor_log;
create trigger secure_submission before insert on public.site_visitor_log
  for each row execute function esnupi_private.guard_submission();

alter table public.museum_photos enable row level security;
alter table public.site_visitor_log enable row level security;
-- Remove broad table grants (including TRUNCATE, which RLS does not protect).
revoke all on public.museum_photos, public.site_visitor_log from public, anon, authenticated;
grant select, insert on public.museum_photos, public.site_visitor_log to anon, authenticated;

alter table public.museum_photos drop constraint if exists museum_photos_image_url_shape;
alter table public.museum_photos add constraint museum_photos_image_url_shape check (
  octet_length(image_url) <= 1000000 and
  image_url ~ '^data:image/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$'
) not valid;
alter table public.museum_photos drop constraint if exists museum_photos_visitor_name_len;
alter table public.museum_photos add constraint museum_photos_visitor_name_len
  check (visitor_name is null or length(visitor_name) between 1 and 60) not valid;
alter table public.site_visitor_log drop constraint if exists site_visitor_log_display_name_len;
alter table public.site_visitor_log add constraint site_visitor_log_display_name_len
  check (length(btrim(display_name)) between 1 and 60) not valid;
commit;
