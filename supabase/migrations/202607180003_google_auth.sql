alter table public.users alter column telegram_id drop not null;
alter table public.users add column if not exists google_id text unique;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists avatar_url text;

alter table public.users drop constraint if exists users_identity_required;
alter table public.users add constraint users_identity_required
  check (telegram_id is not null or google_id is not null);

create unique index if not exists users_email_unique_idx
  on public.users (lower(email))
  where email is not null;
