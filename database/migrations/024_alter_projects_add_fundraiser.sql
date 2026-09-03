-- ============================================================
-- Adds fundraiser columns to Projects table:
-- TargetAmount, RaisedAmount, Images
-- ============================================================
USE UbuntuConnect_DB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'TargetAmount'
)
BEGIN
    ALTER TABLE Projects ADD TargetAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE Projects ADD RaisedAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE Projects ADD Images NVARCHAR(2000) NULL;
    PRINT '024 | Projects — TargetAmount, RaisedAmount, Images columns added.';
END
ELSE
    PRINT '024 | Projects — fundraiser columns already exist, skipped.';
GO
