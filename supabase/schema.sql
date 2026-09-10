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
  category    text        not null default 'none',
  note        text        not null default '',
  excluded_from_reports boolean not null default false,
  date        timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ─── 3. SHARED EXPENSES ("Chi chung") ──────────────────────
-- Xem migration 005_shared_expenses.sql để biết full schema.
-- Bảng shared_debts cũ đã bị thay thế bằng shared_expenses + shared_expense_contacts.

-- ─── 4. CUSTOM SOURCES ─────────────────────────────────────
create table if not exists custom_sources (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  label       text        not null,
  created_at  timestamptz not null default now()
);

-- ─── 5. CATEGORIES ─────────────────────────────────────────
create table if not exists categories (
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
create index if not exists idx_custom_sources_profile   on custom_sources(profile_id);
create index if not exists idx_categories_profile       on categories(profile_id);

-- ─── RLS (Row Level Security) ──────────────────────────────
-- App này không dùng auth, dữ liệu isolate bằng profile_id
-- Bật RLS nhưng cho phép anon key đọc/ghi tự do

alter table profiles       enable row level security;
alter table transactions   enable row level security;
alter table custom_sources enable row level security;
alter table categories     enable row level security;

-- Cho phép anon key full access (không có auth)
create policy "allow_all_profiles"       on profiles       for all using (true) with check (true);
create policy "allow_all_transactions"   on transactions   for all using (true) with check (true);
create policy "allow_all_custom_sources" on custom_sources for all using (true) with check (true);
create policy "allow_all_categories"     on categories     for all using (true) with check (true);
