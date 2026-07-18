create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  telegram_username text,
  first_name text,
  referral_code text unique not null default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  referred_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.plans (id text primary key,name text not null,price_rub integer not null,device_limit integer not null,family_limit integer not null default 1,is_active boolean not null default true);
insert into public.plans values ('mobile','Мобильный',199,2,1,true),('personal','Личный',299,5,1,true),('family','Семейный',449,15,5,true) on conflict do nothing;
create table public.subscriptions (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,plan_id text not null references public.plans(id),status text not null check(status in('pending','active','expired','cancelled')),starts_at timestamptz,expires_at timestamptz,created_at timestamptz not null default now());
create table public.sessions (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,token_hash text unique not null,expires_at timestamptz not null,created_at timestamptz not null default now());
create table public.telegram_login_tokens (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,token_hash text unique not null,expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now());
create table public.families (id uuid primary key default gen_random_uuid(),owner_id uuid unique not null references public.users(id) on delete cascade,created_at timestamptz not null default now());
create table public.family_members (family_id uuid not null references public.families(id) on delete cascade,user_id uuid unique not null references public.users(id) on delete cascade,role text not null check(role in('owner','member')),joined_at timestamptz not null default now(),primary key(family_id,user_id));
create table public.family_invites (id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,token_hash text unique not null,expires_at timestamptz not null,used_by uuid references public.users(id),used_at timestamptz,created_at timestamptz not null default now());
create table public.payments (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id),provider text not null,external_id text unique,status text not null,amount_rub integer not null,created_at timestamptz not null default now(),paid_at timestamptz);
create table public.devices (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,name text not null,platform text,access_id text unique,status text not null default 'active',created_at timestamptz not null default now());
alter table public.users enable row level security;alter table public.plans enable row level security;alter table public.subscriptions enable row level security;alter table public.sessions enable row level security;alter table public.telegram_login_tokens enable row level security;alter table public.families enable row level security;alter table public.family_members enable row level security;alter table public.family_invites enable row level security;alter table public.payments enable row level security;alter table public.devices enable row level security;
create policy "plans are public" on public.plans for select using (is_active=true);
grant select on public.plans to anon, authenticated;
grant all on public.users, public.plans, public.subscriptions, public.sessions, public.telegram_login_tokens, public.families, public.family_members, public.family_invites, public.payments, public.devices to service_role;
create index sessions_token_hash_idx on public.sessions(token_hash);create index sessions_expires_idx on public.sessions(expires_at);create index telegram_login_hash_idx on public.telegram_login_tokens(token_hash);create index subscriptions_user_idx on public.subscriptions(user_id);
