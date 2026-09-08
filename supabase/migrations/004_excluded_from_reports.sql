-- ============================================================
-- Migration 004 - Exclude transactions from reports/charts
-- Adds a metadata flag for transactions that should remain in
-- history but not affect dashboards, charts, category totals,
-- source balances, or calendar/heatmap reporting.
-- ============================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS excluded_from_reports BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_transactions_excluded_from_reports
  ON transactions(excluded_from_reports);
