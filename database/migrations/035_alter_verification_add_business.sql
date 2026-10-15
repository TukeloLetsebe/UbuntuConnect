-- ============================================================
-- 035 | Verification supports Business subjects (not just NPOs)
-- ------------------------------------------------------------
-- Originally a Verification row belonged only to an NPO (NPO_Id
-- NOT NULL, cascading FK). Businesses also submit verification
-- documents (CIPC + tax clearance), so a row must be able to
-- reference EITHER an NPO or a Business.
--
-- This migration:
--   1. Relaxes NPO_Id to NULL and re-creates its FK non-cascading.
--   2. Adds a nullable BusinessId + FK_Verification_Business.
-- A given row sets exactly one of (NPO_Id, BusinessId).
--
-- Mirrors the inline block in MASTER_SCRIPT.sql. Additive +
-- idempotent — existing NPO rows are unaffected.
-- Depends on: 017_create_verification.sql, 005_create_business.sql
-- ============================================================
USE UbuntuConnect_DB;
GO

-- 1. Relax NPO_Id to NULL (drop the cascading FK first, then re-add non-cascading).
IF COL_LENGTH('Verification', 'NPO_Id') IS NOT NULL
   AND COLUMNPROPERTY(OBJECT_ID('Verification'), 'NPO_Id', 'AllowsNull') = 0
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Verification_NPO')
        ALTER TABLE Verification DROP CONSTRAINT FK_Verification_NPO;

    ALTER TABLE Verification ALTER COLUMN NPO_Id INT NULL;

    ALTER TABLE Verification ADD CONSTRAINT FK_Verification_NPO
        FOREIGN KEY (NPO_Id) REFERENCES NPO(NPO_Id);
    PRINT '035 | Verification.NPO_Id relaxed to NULL (FK re-created non-cascading).';
END
ELSE PRINT '035 | Verification.NPO_Id already nullable, skipped.';
GO

-- 2. Add the nullable BusinessId + FK.
IF COL_LENGTH('Verification', 'BusinessId') IS NULL
BEGIN
    ALTER TABLE Verification ADD BusinessId INT NULL
        CONSTRAINT FK_Verification_Business FOREIGN KEY REFERENCES Business(BusinessId);
    PRINT '035 | Verification.BusinessId added.';
END
ELSE PRINT '035 | Verification.BusinessId already exists, skipped.';
GO
