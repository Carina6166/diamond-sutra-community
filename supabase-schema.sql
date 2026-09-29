-- Optional shared leaderboard backend (Supabase)
-- Run this once in Supabase SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '同修',
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  minutes integer not null default 0 check (minutes >= 0 and minutes <= 1440),
  created_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;

create policy "profiles readable by everyone" on public.profiles for select using (true);
create policy "profile insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profile update own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "checkins readable by everyone" on public.checkins for select using (true);
create policy "checkin insert own" on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkin update own" on public.checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
