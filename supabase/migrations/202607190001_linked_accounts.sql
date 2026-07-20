alter table public.users add column if not exists apple_id text unique;

alter table public.users drop constraint if exists users_identity_required;
alter table public.users add constraint users_identity_required
  check (telegram_id is not null or google_id is not null or apple_id is not null);

create table if not exists public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.telegram_link_tokens enable row level security;
grant all on public.telegram_link_tokens to service_role;
create index if not exists telegram_link_hash_idx on public.telegram_link_tokens(token_hash);

create or replace function public.merge_user_accounts(primary_id uuid, secondary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.users%rowtype;
  s public.users%rowtype;
begin
  if primary_id = secondary_id then return; end if;
  select * into p from public.users where id = primary_id for update;
  select * into s from public.users where id = secondary_id for update;
  if p.id is null or s.id is null then raise exception 'account_not_found'; end if;
  if p.telegram_id is not null and s.telegram_id is not null and p.telegram_id <> s.telegram_id then raise exception 'telegram_conflict'; end if;
  if p.google_id is not null and s.google_id is not null and p.google_id <> s.google_id then raise exception 'google_conflict'; end if;
  if p.apple_id is not null and s.apple_id is not null and p.apple_id <> s.apple_id then raise exception 'apple_conflict'; end if;

  update public.subscriptions set user_id = primary_id where user_id = secondary_id;
  update public.sessions set user_id = primary_id where user_id = secondary_id;
  update public.telegram_login_tokens set user_id = primary_id where user_id = secondary_id;
  update public.telegram_link_tokens set user_id = primary_id where user_id = secondary_id;
  update public.payments set user_id = primary_id where user_id = secondary_id;
  update public.devices set user_id = primary_id where user_id = secondary_id;
  update public.notifications set user_id = primary_id where user_id = secondary_id;

  if exists(select 1 from public.family_members where user_id = primary_id) then
    delete from public.family_members where user_id = secondary_id;
  else
    update public.family_members set user_id = primary_id where user_id = secondary_id;
  end if;
  update public.families set owner_id = primary_id where owner_id = secondary_id and not exists(select 1 from public.families where owner_id = primary_id);

  delete from public.referrals where invited_user_id = secondary_id and exists(select 1 from public.referrals where invited_user_id = primary_id);
  update public.referrals set invited_user_id = primary_id where invited_user_id = secondary_id;
  update public.referrals set referrer_id = primary_id where referrer_id = secondary_id and invited_user_id <> primary_id;
  delete from public.referrals where referrer_id = invited_user_id;

  delete from public.users where id = secondary_id;
  update public.users set
    telegram_id = coalesce(p.telegram_id, s.telegram_id),
    telegram_username = coalesce(p.telegram_username, s.telegram_username),
    google_id = coalesce(p.google_id, s.google_id),
    apple_id = coalesce(p.apple_id, s.apple_id),
    email = coalesce(p.email, s.email),
    first_name = coalesce(p.first_name, s.first_name),
    avatar_url = coalesce(p.avatar_url, s.avatar_url),
    updated_at = now()
  where id = primary_id;
end;
$$;
revoke all on function public.merge_user_accounts(uuid, uuid) from public, anon, authenticated;
grant execute on function public.merge_user_accounts(uuid, uuid) to service_role;
