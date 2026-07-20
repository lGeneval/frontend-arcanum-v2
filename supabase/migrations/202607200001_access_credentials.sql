alter table public.users add column if not exists access_id text unique;
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists failed_login_attempts integer not null default 0;
alter table public.users add column if not exists locked_until timestamptz;

alter table public.users drop constraint if exists users_identity_required;
alter table public.users add constraint users_identity_required
  check (telegram_id is not null or google_id is not null or apple_id is not null or access_id is not null);

create index if not exists users_access_id_lower_idx on public.users(lower(access_id));
