-- ============================================================
-- 021 | Alter Transactions — add 'TopUp' to TransactionType CHECK
-- ============================================================
-- Required for the new POST /api/individual/topup endpoint.
-- Without this, inserts with TransactionType = 'TopUp' would
-- violate CHK_Transactions_Type.
-- ============================================================
USE UbuntuConnect_DB;
GO

ALTER TABLE Transactions
DROP CONSTRAINT CHK_Transactions_Type;
GO

ALTER TABLE Transactions
ADD CONSTRAINT CHK_Transactions_Type
CHECK (TransactionType IN ('Donation', 'Withdrawal', 'CampaignContribution', 'TopUp'));
GO

PRINT '021 | Transactions.TransactionType CHECK updated to include TopUp.';
GO
