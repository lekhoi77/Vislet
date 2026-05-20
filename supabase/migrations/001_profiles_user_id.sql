-- ============================================================
-- Migration 001 — Gắn profiles với Supabase Auth
-- Chạy 1 lần trong SQL Editor của Supabase Dashboard
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Thêm cột user_id vào profiles
--    (bỏ qua nếu cột đã tồn tại)
-- ──────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index để query nhanh theo user
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ──────────────────────────────────────────────────────────
-- 2. Bật Row Level Security (RLS) trên tất cả bảng
-- ──────────────────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- 3. RLS policies cho bảng profiles
--    Mỗi user chỉ đọc/ghi được profile của chính mình
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 4. RLS policies cho transactions / debts / sources / goals
--    Kiểm tra quyền sở hữu qua profiles.user_id
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "transactions_all" ON transactions;
CREATE POLICY "transactions_all" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id       = transactions.profile_id
        AND profiles.user_id  = auth.uid()
    )
  );

DROP POLICY IF EXISTS "debts_all" ON debts;
CREATE POLICY "debts_all" ON debts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id       = debts.profile_id
        AND profiles.user_id  = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sources_all" ON sources;
CREATE POLICY "sources_all" ON sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id       = sources.profile_id
        AND profiles.user_id  = auth.uid()
    )
  );

DROP POLICY IF EXISTS "goals_all" ON goals;
CREATE POLICY "goals_all" ON goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id       = goals.profile_id
        AND profiles.user_id  = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- 5. (Tuỳ chọn) Backfill dữ liệu cũ
--    Nếu muốn gán profiles cũ cho 1 tài khoản cụ thể,
--    bỏ comment dòng dưới và thay <YOUR_AUTH_USER_ID>:
-- ──────────────────────────────────────────────────────────
-- UPDATE profiles
--   SET user_id = '<YOUR_AUTH_USER_ID>'
--   WHERE user_id IS NULL;
