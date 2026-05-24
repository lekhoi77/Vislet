-- ============================================================
-- Migration 003 — Shared Debts (multi-tenant)
-- Thay thế hoàn toàn bảng debts cũ bằng shared_debts.
-- ============================================================

-- 1. Add email to profiles (denormalized cho user search)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE profiles
SET email = u.email
FROM auth.users u
WHERE profiles.user_id = u.id AND profiles.email IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_name_lower ON profiles(LOWER(name));

-- 2. Drop bảng debts cũ
DROP TABLE IF EXISTS debts CASCADE;

-- 3. shared_debts
CREATE TABLE IF NOT EXISTS shared_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  creditor_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor_profile_id   UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  creditor_name         TEXT NOT NULL,

  debtor_type           TEXT NOT NULL CHECK (debtor_type IN ('linked','unlinked')),
  debtor_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  debtor_profile_id     UUID REFERENCES profiles(id)   ON DELETE SET NULL,
  debtor_name           TEXT NOT NULL,
  debtor_email          TEXT,

  -- Cho phép user đảo vai (creditor đang nợ debtor): direction='reverse'
  -- Default 'forward': debtor nợ creditor
  direction             TEXT NOT NULL DEFAULT 'forward' CHECK (direction IN ('forward','reverse')),

  total_expense         BIGINT NOT NULL CHECK (total_expense > 0),
  debt_amount           BIGINT NOT NULL CHECK (debt_amount > 0),
  remaining_amount      BIGINT NOT NULL,

  source_transaction_id UUID,

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

CREATE INDEX IF NOT EXISTS idx_shared_debts_creditor_user ON shared_debts(creditor_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_debts_debtor_user   ON shared_debts(debtor_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_debts_status        ON shared_debts(status);

-- 4. shared_debt_payments
CREATE TABLE IF NOT EXISTS shared_debt_payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_debt_id         UUID NOT NULL REFERENCES shared_debts(id) ON DELETE CASCADE,
  amount                 BIGINT NOT NULL CHECK (amount > 0),
  payment_source         TEXT,
  paid_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at           TIMESTAMPTZ,
  note                   TEXT NOT NULL DEFAULT '',
  income_transaction_id  UUID,
  expense_transaction_id UUID
);

CREATE INDEX IF NOT EXISTS idx_payments_debt ON shared_debt_payments(shared_debt_id);

-- 5. debt_notifications
CREATE TABLE IF NOT EXISTS debt_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  shared_debt_id    UUID REFERENCES shared_debts(id) ON DELETE CASCADE,
  actor_name        TEXT NOT NULL,
  amount            BIGINT NOT NULL DEFAULT 0,
  message           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON debt_notifications(recipient_user_id, is_read, created_at DESC);

-- 6. debt_contacts (recent contacts)
CREATE TABLE IF NOT EXISTS debt_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name    TEXT NOT NULL,
  contact_email   TEXT,
  contact_type    TEXT NOT NULL CHECK (contact_type IN ('linked','unlinked')),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debt_contacts_owner ON debt_contacts(owner_user_id, last_used_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_contact_linked
  ON debt_contacts(owner_user_id, contact_user_id) WHERE contact_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_contact_unlinked
  ON debt_contacts(owner_user_id, LOWER(contact_name)) WHERE contact_user_id IS NULL;

-- 7. Transactions: add cờ auto-generated + link tới shared_debt
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS linked_debt_id    UUID REFERENCES shared_debts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS auto_kind         TEXT CHECK (auto_kind IN ('debt_income','debt_expense'));

-- 8. RLS
ALTER TABLE shared_debts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_contacts        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_debts_select" ON shared_debts;
CREATE POLICY "shared_debts_select" ON shared_debts FOR SELECT
  USING (creditor_user_id = auth.uid() OR debtor_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_debts_insert" ON shared_debts;
CREATE POLICY "shared_debts_insert" ON shared_debts FOR INSERT
  WITH CHECK (creditor_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_debts_update" ON shared_debts;
CREATE POLICY "shared_debts_update" ON shared_debts FOR UPDATE
  USING (creditor_user_id = auth.uid() OR debtor_user_id = auth.uid())
  WITH CHECK (creditor_user_id = auth.uid() OR debtor_user_id = auth.uid());

DROP POLICY IF EXISTS "shared_debts_delete" ON shared_debts;
CREATE POLICY "shared_debts_delete" ON shared_debts FOR DELETE
  USING (creditor_user_id = auth.uid());

DROP POLICY IF EXISTS "payments_all" ON shared_debt_payments;
CREATE POLICY "payments_all" ON shared_debt_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shared_debts sd
    WHERE sd.id = shared_debt_payments.shared_debt_id
      AND (sd.creditor_user_id = auth.uid() OR sd.debtor_user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shared_debts sd
    WHERE sd.id = shared_debt_payments.shared_debt_id
      AND (sd.creditor_user_id = auth.uid() OR sd.debtor_user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "notif_select" ON debt_notifications;
CREATE POLICY "notif_select" ON debt_notifications FOR SELECT
  USING (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "notif_insert" ON debt_notifications;
CREATE POLICY "notif_insert" ON debt_notifications FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "notif_update" ON debt_notifications;
CREATE POLICY "notif_update" ON debt_notifications FOR UPDATE
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
DROP POLICY IF EXISTS "notif_delete" ON debt_notifications;
CREATE POLICY "notif_delete" ON debt_notifications FOR DELETE
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "debt_contacts_all" ON debt_contacts;
CREATE POLICY "debt_contacts_all" ON debt_contacts FOR ALL
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 9. RPC: search_users_for_debt — tìm user khác đang có trong hệ thống
CREATE OR REPLACE FUNCTION search_users_for_debt(q TEXT)
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

GRANT EXECUTE ON FUNCTION search_users_for_debt(TEXT) TO authenticated;

-- 10. Trigger: tự cập nhật profiles.email khi tạo profile mới (lấy từ auth.users)
CREATE OR REPLACE FUNCTION sync_profile_email() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_email ON profiles;
CREATE TRIGGER trg_sync_profile_email
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();
