-- ============================================================
-- Migration 005 — Shared Expenses ("Chi chung" / "Chia chi phí")
-- Đổi tên toàn bộ từ shared_debts sang shared_expenses — GIỮ NGUYÊN
-- cơ chế cũ (6 trạng thái, accept/reject/claim/confirm/deny, thông báo,
-- ghi độc lập không cần transaction) — chỉ đổi thuật ngữ "nợ" -> "chi chung".
-- ============================================================

-- A. Gỡ transactions khỏi schema cũ
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_auto_kind_check;
ALTER TABLE transactions RENAME COLUMN linked_debt_id TO linked_shared_expense_id;

-- A2. Dọn dữ liệu cũ: các giao dịch thu/chi tự sinh từ shared_debts cũ đang trỏ tới
-- id không còn tồn tại sau khi ta xoá shared_debts ở bước B — phải NULL trước khi
-- gắn lại FK/CHECK mới ở bước G, nếu không sẽ lỗi 23503 / vi phạm CHECK.
-- Bản thân giao dịch (số tiền, loại, ghi chú...) vẫn được giữ nguyên, chỉ mất liên kết.
UPDATE transactions SET linked_shared_expense_id = NULL WHERE linked_shared_expense_id IS NOT NULL;
UPDATE transactions SET auto_kind = NULL WHERE auto_kind IS NOT NULL;

-- B. Xoá bảng/RPC cũ (theo thứ tự phụ thuộc)
DROP TABLE IF EXISTS shared_debt_payments CASCADE;
DROP TABLE IF EXISTS debt_notifications CASCADE;
DROP TABLE IF EXISTS debt_contacts CASCADE;
DROP TABLE IF EXISTS shared_debts CASCADE;
DROP FUNCTION IF EXISTS search_users_for_debt(TEXT);

-- C. shared_expenses (đổi tên 1:1 từ shared_debts: creditor->owner, debtor->participant, debt_amount->split_amount)
CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_profile_id   UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  owner_name         TEXT NOT NULL,

  participant_type       TEXT NOT NULL CHECK (participant_type IN ('linked','unlinked')),
  participant_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_profile_id UUID REFERENCES profiles(id)   ON DELETE SET NULL,
  participant_name       TEXT NOT NULL,
  participant_email      TEXT,

  -- Cho phép đảo vai (owner đang là người cần trả): direction='reverse'
  -- Default 'forward': participant cần trả owner
  direction             TEXT NOT NULL DEFAULT 'forward' CHECK (direction IN ('forward','reverse')),

  total_expense         BIGINT NOT NULL CHECK (total_expense > 0),
  split_amount          BIGINT NOT NULL CHECK (split_amount > 0),
  remaining_amount      BIGINT NOT NULL,

  -- Nullable: có thể ghi độc lập (không gắn giao dịch) qua form "Ghi chi chung" riêng
  source_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  status                TEXT NOT NULL CHECK (status IN ('pending','active','pending_confirm','settled','rejected','cancelled')),

  note                  TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL DEFAULT 'none',
  due_date              TIMESTAMPTZ,
  reject_reason         TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at           TIMESTAMPTZ,
  settled_at            TIMESTAMPTZ,
  manually_settled      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_shared_expenses_owner       ON shared_expenses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_participant ON shared_expenses(participant_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_status      ON shared_expenses(status);

-- D. shared_expense_payments (đổi tên 1:1 từ shared_debt_payments)
CREATE TABLE IF NOT EXISTS shared_expense_payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_expense_id      UUID NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
  amount                 BIGINT NOT NULL CHECK (amount > 0),
  payment_source         TEXT,
  paid_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at           TIMESTAMPTZ,
  note                   TEXT NOT NULL DEFAULT '',
  income_transaction_id  UUID,
  expense_transaction_id UUID
);

CREATE INDEX IF NOT EXISTS idx_shared_expense_payments_expense ON shared_expense_payments(shared_expense_id);

-- E. shared_expense_notifications (đổi tên 1:1 từ debt_notifications)
CREATE TABLE IF NOT EXISTS shared_expense_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  shared_expense_id UUID REFERENCES shared_expenses(id) ON DELETE CASCADE,
  actor_name        TEXT NOT NULL,
  amount            BIGINT NOT NULL DEFAULT 0,
  message           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_expense_notif_recipient ON shared_expense_notifications(recipient_user_id, is_read, created_at DESC);

-- F. shared_expense_contacts (đổi tên 1:1 từ debt_contacts)
CREATE TABLE IF NOT EXISTS shared_expense_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name    TEXT NOT NULL,
  contact_email   TEXT,
  contact_type    TEXT NOT NULL CHECK (contact_type IN ('linked','unlinked')),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_expense_contacts_owner ON shared_expense_contacts(owner_user_id, last_used_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_se_contact_linked
  ON shared_expense_contacts(owner_user_id, contact_user_id) WHERE contact_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_se_contact_unlinked
  ON shared_expense_contacts(owner_user_id, LOWER(contact_name)) WHERE contact_user_id IS NULL;

-- G. Gắn lại transactions vào bảng mới
ALTER TABLE transactions ADD CONSTRAINT transactions_linked_shared_expense_id_fkey
  FOREIGN KEY (linked_shared_expense_id) REFERENCES shared_expenses(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT transactions_auto_kind_check
  CHECK (auto_kind IN ('split_income','split_expense'));

-- H. RLS
ALTER TABLE shared_expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expense_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expense_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expense_contacts      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_expenses_select" ON shared_expenses;
CREATE POLICY "shared_expenses_select" ON shared_expenses FOR SELECT
  USING (owner_user_id = auth.uid() OR participant_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_expenses_insert" ON shared_expenses;
CREATE POLICY "shared_expenses_insert" ON shared_expenses FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_expenses_update" ON shared_expenses;
CREATE POLICY "shared_expenses_update" ON shared_expenses FOR UPDATE
  USING (owner_user_id = auth.uid() OR participant_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR participant_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_expenses_delete" ON shared_expenses;
CREATE POLICY "shared_expenses_delete" ON shared_expenses FOR DELETE
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_expense_payments_all" ON shared_expense_payments;
CREATE POLICY "shared_expense_payments_all" ON shared_expense_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shared_expenses se
    WHERE se.id = shared_expense_payments.shared_expense_id
      AND (se.owner_user_id = auth.uid() OR se.participant_user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shared_expenses se
    WHERE se.id = shared_expense_payments.shared_expense_id
      AND (se.owner_user_id = auth.uid() OR se.participant_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "shared_expense_notif_select" ON shared_expense_notifications;
CREATE POLICY "shared_expense_notif_select" ON shared_expense_notifications FOR SELECT
  USING (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "shared_expense_notif_insert" ON shared_expense_notifications;
CREATE POLICY "shared_expense_notif_insert" ON shared_expense_notifications FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "shared_expense_notif_update" ON shared_expense_notifications;
CREATE POLICY "shared_expense_notif_update" ON shared_expense_notifications FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "shared_expense_notif_delete" ON shared_expense_notifications;
CREATE POLICY "shared_expense_notif_delete" ON shared_expense_notifications FOR DELETE
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_expense_contacts_all" ON shared_expense_contacts;
CREATE POLICY "shared_expense_contacts_all" ON shared_expense_contacts FOR ALL
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- I. RPC: search_users_for_split — tìm user khác đang có trong hệ thống
CREATE OR REPLACE FUNCTION search_users_for_split(q TEXT)
RETURNS TABLE (user_id UUID, profile_id UUID, name TEXT, email TEXT, avatar_color TEXT, initial TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (p.user_id)
    p.user_id, p.id, p.name, p.email, p.avatar_color, p.initial
  FROM profiles p
  WHERE p.user_id IS NOT NULL
    AND p.user_id <> auth.uid()
    AND length(coalesce(q,'')) >= 1
    AND (LOWER(p.email) LIKE LOWER(q) || '%' OR LOWER(p.name) LIKE LOWER(q) || '%')
  ORDER BY p.user_id, p.created_at ASC
  LIMIT 8;
$$;

GRANT EXECUTE ON FUNCTION search_users_for_split(TEXT) TO authenticated;

-- sync_profile_email() trigger từ migration 003 vẫn giữ nguyên — không liên quan tới tính năng này.
