-- ============================================================
-- 034 | Add Transactions.Reason
-- ------------------------------------------------------------
-- NPO withdrawals must record WHY the funds are being withdrawn
-- (the cause the money is for) so admins can audit the movement.
-- A short category plus optional note is stored as a single
-- free-text string (e.g. "Program costs — new library books").
-- Nullable because existing rows and non-withdrawal transaction
-- types (Donation, TopUp, CampaignContribution) have no reason.
-- The "required for withdrawals" rule is enforced in the API,
-- not the DB. Additive + idempotent — safe to re-run and cannot
-- affect existing rows.
-- Depends on: 008_create_transactions.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('Transactions') AND name = 'Reason'
)
BEGIN
    ALTER TABLE Transactions ADD Reason NVARCHAR(255) NULL;
    PRINT '034 | Transactions.Reason column added.';
END
ELSE
    PRINT '034 | Transactions.Reason already exists, skipped.';
GO
