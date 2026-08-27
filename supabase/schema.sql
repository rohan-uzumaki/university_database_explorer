-- Malaysia University Explorer — database schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run)

-- ───────────────────────────────────────────
-- Tables
-- ───────────────────────────────────────────

create table if not exists universities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tags text[] not null default '{}',
  facts jsonb not null default '{}',        -- { status, established, qs_world, motto, location, website }
  requirements text default '',              -- free-text admission requirements
  scholarships text default '',              -- free-text scholarship / financial aid info
  sections jsonb not null default '[]',       -- [{ title, content }, ...] catch-all profile content
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id) on delete cascade,
  program text not null,
  fields jsonb not null default '{}',         -- { "Total (RM)": "11,940", "Duration": "2 years", ... }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Allowlist of people permitted to edit data. Add trusted emails here
-- (Table Editor → admins → Insert row) — that's the only step needed
-- to grant someone admin access; no code changes required.
create table if not exists admins (
  email text primary key,
  added_at timestamptz not null default now()
);

-- Seed yourself as the first admin — REPLACE with your real email before running.
insert into admins (email) values ('you@example.com')
  on conflict (email) do nothing;

-- ───────────────────────────────────────────
-- Helpful indexes
-- ───────────────────────────────────────────

create index if not exists idx_programs_university_id on programs(university_id);
create index if not exists idx_universities_tags on universities using gin(tags);
create index if not exists idx_universities_name on universities using gin(to_tsvector('english', name));
create index if not exists idx_programs_program on programs using gin(to_tsvector('english', program));

-- ───────────────────────────────────────────
-- updated_at auto-touch
-- ───────────────────────────────────────────

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_universities_touch on universities;
create trigger trg_universities_touch before update on universities
  for each row execute function touch_updated_at();

drop trigger if exists trg_programs_touch on programs;
create trigger trg_programs_touch before update on programs
  for each row execute function touch_updated_at();

-- ───────────────────────────────────────────
-- Row Level Security — public can read, only admins can write
-- ───────────────────────────────────────────

alter table universities enable row level security;
alter table programs enable row level security;
alter table admins enable row level security;

-- Anyone (including logged-out visitors) can read universities & programs
create policy "public can read universities" on universities
  for select using (true);

create policy "public can read programs" on programs
  for select using (true);

-- Only signed-in users whose email is in the admins table can write
create policy "admins can insert universities" on universities
  for insert with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
create policy "admins can update universities" on universities
  for update using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
create policy "admins can delete universities" on universities
  for delete using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

create policy "admins can insert programs" on programs
  for insert with check (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
create policy "admins can update programs" on programs
  for update using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
create policy "admins can delete programs" on programs
  for delete using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));

-- Admins table: an admin can see the allowlist (so the UI can show it);
-- only editable directly via the Supabase dashboard (service role), not via the app.
create policy "admins can read admin list" on admins
  for select using (exists (select 1 from admins a where a.email = auth.jwt() ->> 'email'));
