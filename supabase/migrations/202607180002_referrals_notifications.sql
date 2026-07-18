create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  invited_user_id uuid unique not null references public.users(id) on delete cascade,
  reward_status text not null default 'pending' check (reward_status in ('pending','earned','cancelled')),
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  dedupe_key text unique not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
grant all on public.referrals, public.notifications to service_role;
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists notifications_user_idx on public.notifications(user_id);
