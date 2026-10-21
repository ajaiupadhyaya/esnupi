-- Run against a disposable database with the project schema + migration applied.
-- A failed assertion stops psql; all test writes are rolled back.
\set ON_ERROR_STOP on
begin;
set role anon;
insert into public.museum_photos (id, image_url, visitor_name, created_at)
values ('00000000-0000-0000-0000-000000000001', 'data:image/jpeg;base64,/9j/2Q==', ' test ', '2099-01-01');
do $$
begin
  if exists (select 1 from public.museum_photos where id = '00000000-0000-0000-0000-000000000001' or created_at > now() + interval '1 minute') then
    raise exception 'Forged id or future timestamp survived';
  end if;
  begin
    insert into public.museum_photos(image_url) values ('https://tracker.example/pixel');
    raise exception 'External image accepted';
  exception when check_violation then null; end;
  begin
    insert into public.museum_photos(image_url) values ('data:image/svg+xml;base64,PHN2Zz4=');
    raise exception 'SVG accepted';
  exception when check_violation then null; end;
  begin
    insert into public.museum_photos(image_url) values ('data:image/jpeg;base64,' || repeat('A', 1000000));
    raise exception 'Oversized image accepted';
  exception when check_violation then null; end;
  begin
    update public.museum_photos set visitor_name = 'modified';
    raise exception 'Anonymous update permitted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.museum_photos;
    raise exception 'Anonymous delete permitted';
  exception when insufficient_privilege then null; end;
  begin
    truncate public.museum_photos;
    raise exception 'Anonymous truncate permitted';
  exception when insufficient_privilege then null; end;
  begin
    update esnupi_private.submission_budget set minute_count = 0;
    raise exception 'Budget tampering permitted';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.site_visitor_log(display_name, visited_at) values (' visitor ', '2099-01-01');
do $$ begin
  if exists (select 1 from public.site_visitor_log where visited_at > now() + interval '1 minute') then
    raise exception 'Forged visit timestamp survived';
  end if;
  begin
    insert into public.site_visitor_log(display_name) values (repeat('x', 61));
    raise exception 'Long name accepted';
  exception when check_violation then null; end;
  begin
    insert into public.site_visitor_log(display_name) values ('   ');
    raise exception 'Blank name accepted';
  exception when check_violation then null; end;
end $$;
reset role;
update esnupi_private.submission_budget set minute_count = 10 where kind = 'museum_photos';
set role anon;
do $$ begin
  begin
    insert into public.museum_photos(image_url) values ('data:image/jpeg;base64,/9j/2Q==');
    raise exception 'FAIL: Minute budget bypassed';
  exception when raise_exception then
    if sqlerrm <> 'Submission limit reached. Please try later.' then raise; end if;
  end;
end $$;
reset role;
update esnupi_private.submission_budget set minute_count = 0, day_count = 100 where kind = 'museum_photos';
set role authenticated;
do $$ begin
  begin
    insert into public.museum_photos(image_url) values ('data:image/jpeg;base64,/9j/2Q==');
    raise exception 'FAIL: Daily budget bypassed';
  exception when raise_exception then
    if sqlerrm <> 'Submission limit reached. Please try later.' then raise; end if;
  end;
  begin
    truncate public.site_visitor_log;
    raise exception 'Authenticated truncate permitted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Administrative fixture setup tests the independent total-storage ceiling.
alter table public.museum_photos disable trigger secure_submission;
insert into public.museum_photos(image_url)
select 'data:image/jpeg;base64,/9j/2Q==' from generate_series(1, 499);
alter table public.museum_photos enable trigger secure_submission;
update esnupi_private.submission_budget set minute_count = 0, day_count = 0 where kind = 'museum_photos';
set role anon;
do $$ begin
  begin
    insert into public.museum_photos(image_url) values ('data:image/jpeg;base64,/9j/2Q==');
    raise exception 'FAIL: Total storage budget bypassed';
  exception when raise_exception then
    if sqlerrm <> 'Submission limit reached. Please try later.' then raise; end if;
  end;
end $$;
rollback;
\echo 'Submission security assertions passed'
