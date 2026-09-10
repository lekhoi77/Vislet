-- ============================================================
-- Migration 006 — Cho phép ghi giao dịch tự sinh chéo profile
--
-- Bug: khi owner bấm "Đã nhận" (confirmPayment) hoặc "Đánh dấu đã nhận"
-- (manualSettle), hệ thống cần tạo 2 giao dịch: 1 khoản thu vào profile
-- của owner + 1 khoản chi vào profile của participant — nhưng cả 2 lệnh
-- insert đều chạy dưới quyền đăng nhập của owner. RLS "transactions_all"
-- (migration 001) chỉ cho phép ghi vào profile CỦA CHÍNH MÌNH, nên khoản
-- chi cho participant bị chặn ngầm (lỗi bị catch và console.error, không
-- hiện ra UI) — owner thấy khoản thu của mình nhưng participant không
-- bao giờ thấy khoản chi tương ứng.
--
-- Fix: thêm 1 policy bổ sung (permissive, OR với policy cũ) cho phép
-- insert 1 giao dịch tự sinh (is_auto_generated) vào profile của NGƯỜI
-- KIA, miễn là người gọi (auth.uid()) là owner hoặc participant của
-- đúng khoản shared_expense đó, và profile_id/auto_kind khớp đúng vai.
-- ============================================================

DROP POLICY IF EXISTS "transactions_shared_expense_insert" ON transactions;
CREATE POLICY "transactions_shared_expense_insert" ON transactions FOR INSERT
WITH CHECK (
  is_auto_generated = true
  AND linked_shared_expense_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM shared_expenses se
    WHERE se.id = transactions.linked_shared_expense_id
      AND (se.owner_user_id = auth.uid() OR se.participant_user_id = auth.uid())
      AND (
        (transactions.auto_kind = 'split_income'  AND transactions.profile_id = se.owner_profile_id)
        OR
        (transactions.auto_kind = 'split_expense' AND transactions.profile_id = se.participant_profile_id)
      )
  )
);
