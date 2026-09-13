-- ============================================================
-- Adds IsEmailVerified to Users. This is Stage 1 verification
-- (email ownership), distinct from IsVerified which represents
-- Stage 2 identity/KYC/document approval by an admin.
-- Depends on: 002_create_users.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('Users') AND name = 'IsEmailVerified'
)
BEGIN
    ALTER TABLE Users ADD IsEmailVerified BIT NOT NULL DEFAULT 0;
    PRINT '027 | Users — IsEmailVerified column added.';
END
ELSE
    PRINT '027 | Users — IsEmailVerified already exists, skipped.';
GO
