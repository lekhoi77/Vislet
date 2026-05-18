-- ============================================================
-- Vislet App — Supabase Schema
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- ============================================================

-- ─── 1. PROFILES ───────────────────────────────────────────
create table if not exists profiles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  avatar_color text       not null default '#3D9A6E',
  initial     text        not null,
  created_at  timestamptz not null default now()
);

-- ─── 2. TRANSACTIONS ───────────────────────────────────────
create table if not exists transactions (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  type        text        not null check (type in ('income', 'expense')),
  title       text        not null,
  amount      bigint      not null check (amount > 0),
  source      text        not null,
  goal        text        not null default 'none',
  note        text        not null default '',
  date        timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ─── 3. DEBTS ──────────────────────────────────────────────
create table if not exists debts (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  type        text        not null check (type in ('owe', 'lend')),
  person      text        not null,
  amount      bigint      not null check (amount > 0),
  note        text        not null default '',
  due_date    timestamptz,
  settled     boolean     not null default false,
  settled_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── 4. CUSTOM SOURCES ─────────────────────────────────────
create table if not exists custom_sources (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  label       text        not null,
  created_at  timestamptz not null default now()
);

-- ─── 5. CUSTOM BUDGETS ─────────────────────────────────────
create table if not exists custom_budgets (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  label       text        not null,
  icon        text        not null,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ───────────────────────────────────────────────
create index if not exists idx_transactions_profile_id on transactions(profile_id);
create index if not exists idx_transactions_date        on transactions(date desc);
create index if not exists idx_transactions_type        on transactions(type);
create index if not exists idx_debts_profile_id         on debts(profile_id);
create index if not exists idx_debts_settled            on debts(settled);
create index if not exists idx_custom_sources_profile   on custom_sources(profile_id);
create index if not exists idx_custom_budgets_profile   on custom_budgets(profile_id);

-- ─── RLS (Row Level Security) ──────────────────────────────
-- App này không dùng auth, dữ liệu isolate bằng profile_id
-- Bật RLS nhưng cho phép anon key đọc/ghi tự do

alter table profiles       enable row level security;
alter table transactions   enable row level security;
alter table debts          enable row level security;
alter table custom_sources enable row level security;
alter table custom_budgets enable row level security;

-- Cho phép anon key full access (không có auth)
create policy "allow_all_profiles"       on profiles       for all using (true) with check (true);
create policy "allow_all_transactions"   on transactions   for all using (true) with check (true);
create policy "allow_all_debts"          on debts          for all using (true) with check (true);
create policy "allow_all_custom_sources" on custom_sources for all using (true) with check (true);
create policy "allow_all_custom_budgets" on custom_budgets for all using (true) with check (true);
