-- ============================================================
-- Migration 002 — Đổi tên "goals" → "categories"
-- "Mục tiêu" giờ được gọi là "Danh mục" trong UI.
-- Chạy trong Supabase SQL Editor.
-- ============================================================

-- 1. Rename table goals → categories
ALTER TABLE IF EXISTS goals RENAME TO categories;

-- 2. Rename column transactions.goal → transactions.category
ALTER TABLE transactions RENAME COLUMN goal TO category;

-- 3. Rename index nếu có
ALTER INDEX IF EXISTS idx_goals_profile RENAME TO idx_categories_profile;

-- 4. Drop policy cũ + tạo policy mới trên categories
DROP POLICY IF EXISTS "goals_all"      ON categories;
DROP POLICY IF EXISTS "allow_all_goals" ON categories;

DROP POLICY IF EXISTS "categories_all" ON categories;
CREATE POLICY "categories_all" ON categories
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = categories.profile_id AND profiles.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = categories.profile_id AND profiles.user_id = auth.uid()
  ));
